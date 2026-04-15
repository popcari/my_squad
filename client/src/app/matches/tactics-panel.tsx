'use client';

import {
  FootballPitch,
  type FootballPitchSlot,
  type UniformColors,
} from '@/components/football-pitch';
import { Select } from '@/components/ui/select';
import { UniformVisual } from '@/components/uniform-visual';
import type { MatchLineup, Position, User, UserPosition } from '@/types';
import type { Formation } from '@/types/formation';
import {
  getPositionGroupColorClass,
  getPositionGroupWeight,
} from '@/utils/position-badge';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface TacticsPanelProps {
  loading: boolean;
  players: User[];
  lineups: MatchLineup[];
  formations: Formation[];
  selectedFormationId: string;
  onFormationChange: (id: string) => void;
  canManage: boolean;
  /** All position catalogue (for looking up names). */
  positions: Position[];
  /** Per-user position assignments (primary used for grouping). */
  userPositions: UserPosition[];
  /** Latest team uniform colors to display on pitch */
  uniform?: UniformColors;
  /** Adds a new lineup entry (new player never seen before). */
  onAddLineup: (data: {
    userId: string;
    type: 'starting' | 'substitute';
    slotIndex?: number | null;
  }) => Promise<void>;
  /** Updates type/slotIndex of an existing lineup entry. */
  onUpdateLineup: (
    id: string,
    data: Partial<Pick<MatchLineup, 'type' | 'slotIndex'>>,
  ) => Promise<void>;
  /** Fully removes a lineup entry (used for bench cleanup). */
  onRemoveLineup: (lineupId: string) => Promise<void>;
}

/**
 * Tactics panel — server is the source of truth for slot positions.
 *
 * Each MatchLineup carries a `slotIndex` (for starting players) or `null` (for
 * bench players). The component renders purely from the `lineups` prop and
 * fires API calls immediately on each tap. Reload always shows the last saved
 * arrangement exactly.
 */
type PositionGroup = 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER';

const GROUP_ORDER: PositionGroup[] = ['GK', 'DEF', 'MID', 'FWD', 'OTHER'];
const GROUP_KEYS: Record<PositionGroup, string> = {
  GK: 'tactics.groupGK',
  DEF: 'tactics.groupDEF',
  MID: 'tactics.groupMID',
  FWD: 'tactics.groupFWD',
  OTHER: 'tactics.groupOTHER',
};

/** Classify a position name into one of 4 football role groups. */
function classifyPosition(name: string): PositionGroup {
  const n = name.toLowerCase();
  if (n.includes('keeper') || n === 'gk') return 'GK';
  if (
    n.includes('defend') ||
    n.includes('back') ||
    n === 'cb' ||
    n === 'lb' ||
    n === 'rb'
  )
    return 'DEF';
  if (
    n.includes('midfield') ||
    n.includes('middle') ||
    n === 'cm' ||
    n === 'lm' ||
    n === 'rm' ||
    n === 'cdm' ||
    n === 'cam'
  )
    return 'MID';
  if (
    n.includes('forward') ||
    n.includes('striker') ||
    n.includes('winger') ||
    n === 'st' ||
    n === 'cf' ||
    n === 'lw' ||
    n === 'rw'
  )
    return 'FWD';
  return 'OTHER';
}

export function TacticsPanel({
  loading,
  players,
  lineups,
  formations,
  selectedFormationId,
  onFormationChange,
  canManage,
  positions,
  userPositions,
  uniform,
  onAddLineup,
  onUpdateLineup,
  onRemoveLineup,
}: TacticsPanelProps) {
  const { t } = useTranslation();
  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId),
    [formations, selectedFormationId],
  );

  // Lookup: slotIndex -> lineup (for starting players).
  const slotToLineup = useMemo(() => {
    const map = new Map<number, MatchLineup>();
    for (const l of lineups) {
      if (l.type === 'starting' && typeof l.slotIndex === 'number') {
        map.set(l.slotIndex, l);
      }
    }
    return map;
  }, [lineups]);

  const substituteLineups = useMemo(
    () => lineups.filter((l) => l.type === 'substitute'),
    [lineups],
  );

  const startingCount = useMemo(
    () => lineups.filter((l) => l.type === 'starting').length,
    [lineups],
  );

  // Primary position lookup per user, used for sort + colour badges.
  const primaryPositionOfUser = useMemo(() => {
    const byId = new Map(positions.map((p) => [p.id, p]));
    const m = new Map<string, Position>();
    for (const up of userPositions) {
      if (up.type !== 'primary') continue;
      const pos = byId.get(up.positionId);
      if (pos) m.set(up.userId, pos);
    }
    return m;
  }, [positions, userPositions]);

  // Substitute players = ONLY explicitly-added sub lineups, sorted by position
  // group weight (GK → DEF → MID → FWD → UNKNOWN). Matches ScoreModal.
  const substitutePlayers = useMemo<User[]>(() => {
    const subs = substituteLineups
      .map((l) => players.find((p) => p.id === l.userId))
      .filter((p): p is User => !!p);
    return subs.sort(
      (a, b) =>
        getPositionGroupWeight(primaryPositionOfUser.get(a.id)) -
        getPositionGroupWeight(primaryPositionOfUser.get(b.id)),
    );
  }, [players, substituteLineups, primaryPositionOfUser]);

  // Players with zero lineup rows — available to pick as a new substitute, and
  // also selectable in the slot picker so a coach can promote them directly.
  const unassignedPlayers = useMemo<User[]>(() => {
    const assignedIds = new Set(lineups.map((l) => l.userId));
    return players.filter((p) => !assignedIds.has(p.id));
  }, [players, lineups]);

  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // Map userId → position group (for grouping inside the slot picker modal).
  const groupOfUser = useMemo(() => {
    const m = new Map<string, PositionGroup>();
    for (const [userId, pos] of primaryPositionOfUser) {
      m.set(userId, classifyPosition(pos.name));
    }
    return m;
  }, [primaryPositionOfUser]);

  // Slot picker pool = subs + unassigned (coach may promote non-attending).
  const slotPickerPool = useMemo<User[]>(
    () => [...substitutePlayers, ...unassignedPlayers],
    [substitutePlayers, unassignedPlayers],
  );

  const slotPickerByGroup = useMemo(() => {
    const groups: Record<PositionGroup, User[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
      OTHER: [],
    };
    for (const p of slotPickerPool) {
      const g = groupOfUser.get(p.id) ?? 'OTHER';
      groups[g].push(p);
    }
    return groups;
  }, [slotPickerPool, groupOfUser]);

  const pitchSlots: FootballPitchSlot[] = useMemo(
    () => selectedFormation?.slots.map((s) => ({ ...s })) ?? [],
    [selectedFormation],
  );

  const handleSlotClick = (slotIndex: number) => {
    if (!canManage) return;
    setActiveSlot(slotIndex);
  };

  /** Assign a bench player to the currently active slot. */
  const handleAssign = async (userId: string) => {
    if (activeSlot === null) return;
    const slotIndex = activeSlot;
    setActiveSlot(null);

    // If slot is already filled by someone else, move them to bench first.
    const occupant = slotToLineup.get(slotIndex);
    if (occupant) {
      if (occupant.userId === userId) return; // same player — no-op
      await onUpdateLineup(occupant.id, {
        type: 'substitute',
        slotIndex: null,
      });
    }

    // Promote an existing substitute lineup to starting, or create a new one.
    const existingSub = substituteLineups.find((l) => l.userId === userId);
    if (existingSub) {
      await onUpdateLineup(existingSub.id, {
        type: 'starting',
        slotIndex,
      });
    } else {
      await onAddLineup({ userId, type: 'starting', slotIndex });
    }
  };

  /** Demote the player at the active slot to the bench. */
  const handleMoveToBench = async () => {
    if (activeSlot === null) return;
    const lineup = slotToLineup.get(activeSlot);
    setActiveSlot(null);
    if (!lineup) return;
    await onUpdateLineup(lineup.id, {
      type: 'substitute',
      slotIndex: null,
    });
  };

  /** Remove a substitute from the squad entirely. */
  const handleRemoveSubstitute = async (userId: string) => {
    const sub = substituteLineups.find((l) => l.userId === userId);
    if (sub) await onRemoveLineup(sub.id);
  };

  if (loading) {
    return (
      <div className="text-center py-4 text-muted">{t('tactics.loading')}</div>
    );
  }

  if (formations.length === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        <p>{t('tactics.noFormations')}</p>
        <a href="/formations" className="text-primary hover:underline">
          {t('tactics.createFormationLink')}
        </a>
      </div>
    );
  }

  const activeSlotLineup =
    activeSlot !== null ? slotToLineup.get(activeSlot) : undefined;
  const activeSlotPlayer = activeSlotLineup
    ? players.find((p) => p.id === activeSlotLineup.userId)
    : null;
  const activeSlotRole =
    activeSlot !== null && selectedFormation
      ? selectedFormation.slots[activeSlot]?.role
      : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">
          {t('tactics.formationLabel')}
        </span>
        <div className="w-40">
          <Select
            value={selectedFormationId}
            onChange={(e) => onFormationChange(e.target.value)}
            aria-label={t('tactics.selectFormation')}
          >
            {formations.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <FootballPitch
        slots={pitchSlots}
        renderSlot={(slot, i) => {
          const lineup = slotToLineup.get(i);
          const player = lineup
            ? players.find((p) => p.id === lineup.userId)
            : undefined;
          return (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSlotClick(i);
              }}
              aria-label={
                player
                  ? `${slot.role} — ${player.displayName}`
                  : t('tactics.assignTo', { role: slot.role })
              }
              className={`flex flex-col items-center gap-0.5 transition-all ${
                canManage ? 'cursor-pointer hover:scale-110' : 'cursor-default'
              } ${
                activeSlot === i
                  ? 'scale-125 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                  : ''
              }`}
            >
              {uniform ? (
                <>
                  <UniformVisual
                    shirtColor={uniform.shirtColor}
                    pantColor={uniform.pantColor}
                    numberColor={uniform.numberColor}
                    number={
                      player?.jerseyNumber != null
                        ? String(player.jerseyNumber)
                        : undefined
                    }
                    className={`w-12 h-15 drop-shadow-md ${
                      !player ? 'opacity-40' : ''
                    } ${activeSlot === i ? 'animate-pulse' : ''}`}
                  />
                  <span
                    className={`text-[12px] md:text-[14px] font-bold leading-none max-w-[70px] truncate ${
                      activeSlot === i ? 'text-yellow-300' : 'text-white'
                    }`}
                    style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                  >
                    {player?.displayName ?? slot.role}
                  </span>
                </>
              ) : (
                <>
                  <div
                    className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center border-2 shadow-lg ${
                      player
                        ? 'bg-primary text-white border-white'
                        : 'bg-white/90 text-green-800 border-dashed border-white'
                    }`}
                  >
                    {player ? (player.jerseyNumber ?? '?') : slot.role}
                  </div>
                  <span className="text-[10px] text-white font-medium drop-shadow bg-black/40 px-1 rounded max-w-[70px] truncate">
                    {player?.displayName ?? slot.role}
                  </span>
                </>
              )}
            </button>
          );
        }}
      />

      {/* Substitutes + Attendance */}
      <aside className="bg-background rounded-lg p-3 flex flex-col">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <p className="text-xs font-semibold text-yellow-400 uppercase">
            {t('tactics.substitutes', { count: substitutePlayers.length })}
          </p>
          <p
            data-testid="attendance-counter"
            className="text-[11px] text-muted"
          >
            <span className="font-semibold text-foreground">
              {t('tactics.attendance.total', {
                count: startingCount + substitutePlayers.length,
              })}
            </span>
            <span className="mx-1">·</span>
            <span>
              {t('tactics.attendance.breakdown', {
                starting: startingCount,
                sub: substitutePlayers.length,
              })}
            </span>
          </p>
        </div>
        <ul className="flex flex-col gap-1 flex-1">
          {substitutePlayers.length === 0 && (
            <li className="text-xs text-muted">
              {t('tactics.noBenchPlayers')}
            </li>
          )}
          {substitutePlayers.map((p) => {
            const pos = primaryPositionOfUser.get(p.id);
            const colorClass = getPositionGroupColorClass(pos);
            return (
              <li
                key={p.id}
                data-testid="substitute-chip"
                className="flex items-center gap-2 bg-card border border-yellow-500/40 rounded-md px-2 py-1.5 text-xs"
              >
                <span
                  data-testid={`sub-badge-${p.id}`}
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded shrink-0 ${colorClass}`}
                >
                  {pos ? pos.name.toUpperCase() : t('tactics.subBadge')}
                </span>
                <span className="font-bold text-primary shrink-0">
                  #{p.jerseyNumber ?? '-'}
                </span>
                <span className="truncate flex-1">{p.displayName}</span>
                {canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubstitute(p.id)}
                    className="text-danger hover:bg-danger/20 px-1 rounded shrink-0"
                    aria-label={t('tactics.removeSubstitute', {
                      name: p.displayName,
                    })}
                  >
                    &times;
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        {canManage && unassignedPlayers.length > 0 && (
          <Select
            data-testid="add-substitute-select"
            aria-label={t('tactics.addSubstitute')}
            value=""
            onChange={(e) => {
              const userId = e.target.value;
              if (!userId) return;
              void onAddLineup({
                userId,
                type: 'substitute',
                slotIndex: null,
              });
            }}
            className="mt-2 text-xs w-full"
          >
            <option value="">{t('tactics.addSubstitute')}</option>
            {unassignedPlayers.map((p) => {
              const pos = primaryPositionOfUser.get(p.id);
              return (
                <option key={p.id} value={p.id}>
                  #{p.jerseyNumber ?? '-'} {p.displayName}
                  {pos ? ` (${pos.name})` : ''}
                </option>
              );
            })}
          </Select>
        )}
      </aside>

      {activeSlot !== null && canManage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            activeSlotPlayer
              ? `Edit ${activeSlotPlayer.displayName}`
              : t('tactics.assignTo', { role: activeSlotRole })
          }
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4"
          onClick={() => setActiveSlot(null)}
        >
          <div
            className="bg-card rounded-xl w-full max-w-md flex flex-col max-h-[80vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-lg font-semibold">
                  {activeSlotPlayer
                    ? activeSlotPlayer.displayName
                    : `Assign ${activeSlotRole}`}
                </h3>
                <p className="text-xs text-muted">
                  {t('tactics.slotLabel', { role: activeSlotRole })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                aria-label="Close"
                className="text-muted hover:text-foreground text-2xl leading-none px-2"
              >
                &times;
              </button>
            </header>

            <div className="overflow-y-auto flex-1 p-2">
              {activeSlotPlayer && (
                <button
                  type="button"
                  onClick={() => void handleMoveToBench()}
                  className="w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg text-left mb-2"
                >
                  {t('tactics.moveToBench')}
                </button>
              )}

              <p className="text-xs text-muted uppercase tracking-wide px-3 py-1">
                {activeSlotPlayer
                  ? t('tactics.swapWith')
                  : t('tactics.choosePlayer')}
              </p>
              {slotPickerPool.length === 0 && (
                <p className="text-sm text-muted px-3 py-4">
                  {t('tactics.noPlayersAvailable')}
                </p>
              )}
              {GROUP_ORDER.map((group) => {
                const list = slotPickerByGroup[group];
                if (list.length === 0) return null;
                return (
                  <section key={group} className="mb-2">
                    <h4 className="text-[10px] font-semibold text-muted uppercase tracking-wider px-3 pt-2 pb-1">
                      {t(GROUP_KEYS[group])}
                    </h4>
                    <ul>
                      {list.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => void handleAssign(p.id)}
                            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover text-left"
                          >
                            <span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                              #{p.jerseyNumber ?? '-'}
                            </span>
                            <span className="flex-1 text-sm">
                              {p.displayName}
                            </span>
                            {substituteLineups.some(
                              (l) => l.userId === p.id,
                            ) && (
                              <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                                {t('tactics.subBadge')}
                              </span>
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
