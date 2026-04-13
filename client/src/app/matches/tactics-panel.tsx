'use client';

import {
  FootballPitch,
  type FootballPitchSlot,
} from '@/components/football-pitch';
import { Select } from '@/components/ui/select';
import type { MatchLineup, User } from '@/types';
import type { Formation } from '@/types/formation';
import { useEffect, useMemo, useState } from 'react';

export interface TacticsPanelProps {
  loading: boolean;
  players: User[];
  lineups: MatchLineup[];
  formations: Formation[];
  selectedFormationId: string;
  onFormationChange: (id: string) => void;
  canManage: boolean;
  onAddLineup: (
    userId: string,
    type: 'starting' | 'substitute',
  ) => Promise<void>;
  onRemoveLineup: (lineupId: string) => Promise<void>;
}

/**
 * Tactics panel — mobile-friendly tap-to-select interaction.
 * Slot layout is driven by a client-side `slotMap` (slotIndex → userId),
 * because the backend's MatchLineup entity has no `slotIndex` field.
 */
export function TacticsPanel({
  loading,
  players,
  lineups,
  formations,
  selectedFormationId,
  onFormationChange,
  canManage,
  onAddLineup,
  onRemoveLineup,
}: TacticsPanelProps) {
  const selectedFormation = useMemo(
    () => formations.find((f) => f.id === selectedFormationId),
    [formations, selectedFormationId],
  );

  const startingLineups = useMemo(
    () => lineups.filter((l) => l.type === 'starting'),
    [lineups],
  );
  const substituteLineups = useMemo(
    () => lineups.filter((l) => l.type === 'substitute'),
    [lineups],
  );

  const slotCount = selectedFormation?.slots.length ?? 0;
  const [slotMap, setSlotMap] = useState<(string | null)[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  // Sync slotMap with starting lineups (preserve existing assignments).
  useEffect(() => {
    if (slotCount === 0) {
      setSlotMap([]);
      return;
    }
    const startingIds = new Set(startingLineups.map((l) => l.userId));
    setSlotMap((prev) => {
      const next: (string | null)[] = Array(slotCount).fill(null);
      const used = new Set<string>();
      prev.forEach((uid, i) => {
        if (i < slotCount && uid && startingIds.has(uid)) {
          next[i] = uid;
          used.add(uid);
        }
      });
      const unplaced = startingLineups
        .filter((l) => !used.has(l.userId))
        .map((l) => l.userId);
      let cursor = 0;
      for (const uid of unplaced) {
        while (cursor < slotCount && next[cursor] !== null) cursor++;
        if (cursor >= slotCount) break;
        next[cursor] = uid;
        cursor++;
      }
      const unchanged =
        prev.length === next.length && prev.every((v, i) => v === next[i]);
      return unchanged ? prev : next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- derived from lineups
  }, [lineups, slotCount]);

  const playerOnPitchIds = useMemo(
    () => new Set(slotMap.filter((uid): uid is string => !!uid)),
    [slotMap],
  );

  const benchPool = useMemo<User[]>(() => {
    const assignedIds = new Set(lineups.map((l) => l.userId));
    const subs = substituteLineups
      .map((l) => players.find((p) => p.id === l.userId))
      .filter((p): p is User => !!p);
    const unassigned = players.filter((p) => !assignedIds.has(p.id));
    const orphanStarters = startingLineups
      .filter((l) => !playerOnPitchIds.has(l.userId))
      .map((l) => players.find((p) => p.id === l.userId))
      .filter((p): p is User => !!p);
    return [...subs, ...orphanStarters, ...unassigned];
  }, [players, lineups, substituteLineups, startingLineups, playerOnPitchIds]);

  const pitchSlots: FootballPitchSlot[] = useMemo(() => {
    return selectedFormation?.slots.map((s) => ({ ...s })) ?? [];
  }, [selectedFormation]);

  const playerAt = (slotIndex: number): User | undefined => {
    const uid = slotMap[slotIndex];
    return uid ? players.find((p) => p.id === uid) : undefined;
  };
  const lineupAt = (slotIndex: number): MatchLineup | undefined => {
    const uid = slotMap[slotIndex];
    return uid ? startingLineups.find((l) => l.userId === uid) : undefined;
  };

  const handleSlotClick = (slotIndex: number) => {
    if (!canManage) return;
    setActiveSlot(slotIndex);
  };

  const handleAssign = async (userId: string) => {
    if (activeSlot === null) return;
    const slotIndex = activeSlot;
    const existingUid = slotMap[slotIndex];
    // If tapping same user, close.
    if (existingUid === userId) {
      setActiveSlot(null);
      return;
    }

    // Optimistic: place userId at slot, bump existing to bench.
    setSlotMap((prev) => {
      const next = [...prev];
      next[slotIndex] = userId;
      return next;
    });
    setActiveSlot(null);

    // If user was already on pitch at another slot, just swap slots (both
    // remain starting on the backend — no calls needed for swap).
    const previousSlotOfUser = slotMap.findIndex((uid) => uid === userId);
    if (previousSlotOfUser >= 0 && previousSlotOfUser !== slotIndex) {
      setSlotMap((prev) => {
        const next = [...prev];
        next[previousSlotOfUser] = existingUid ?? null;
        return next;
      });
      return;
    }

    // Bench → slot: add the new player as starting, remove their substitute lineup.
    const subLineup = substituteLineups.find((l) => l.userId === userId);
    if (subLineup) await onRemoveLineup(subLineup.id);

    // Displaced previous starter (if any): remove starting, add substitute.
    if (existingUid) {
      const displaced = startingLineups.find((l) => l.userId === existingUid);
      if (displaced) {
        await onRemoveLineup(displaced.id);
        await onAddLineup(existingUid, 'substitute');
      }
    }
    await onAddLineup(userId, 'starting');
  };

  const handleRemoveFromSlot = async () => {
    if (activeSlot === null) return;
    const uid = slotMap[activeSlot];
    setActiveSlot(null);
    if (!uid) return;

    setSlotMap((prev) => {
      const next = [...prev];
      const idx = next.findIndex((u) => u === uid);
      if (idx >= 0) next[idx] = null;
      return next;
    });

    const lineup = startingLineups.find((l) => l.userId === uid);
    if (lineup) {
      await onRemoveLineup(lineup.id);
      await onAddLineup(uid, 'substitute');
    }
  };

  const handleRemoveSubstitute = async (userId: string) => {
    const sub = substituteLineups.find((l) => l.userId === userId);
    if (sub) await onRemoveLineup(sub.id);
  };

  if (loading) {
    return <div className="text-center py-4 text-muted">Loading...</div>;
  }

  if (formations.length === 0) {
    return (
      <div className="text-center py-6 text-muted text-sm">
        <p>No formations available.</p>
        <a href="/formations" className="text-primary hover:underline">
          Create a formation →
        </a>
      </div>
    );
  }

  const activeSlotPlayer = activeSlot !== null ? playerAt(activeSlot) : null;
  const activeSlotRole =
    activeSlot !== null && selectedFormation
      ? selectedFormation.slots[activeSlot]?.role
      : '';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted">Formation:</span>
        <div className="flex-1 max-w-[200px]">
          <Select
            value={selectedFormationId}
            onChange={(e) => onFormationChange(e.target.value)}
            aria-label="Select formation"
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
          const player = playerAt(i);
          const lineup = lineupAt(i);
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
                  : `Assign player to ${slot.role}`
              }
              className={`flex flex-col items-center gap-0.5 ${
                canManage ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center border-2 shadow-lg ${
                  player
                    ? 'bg-primary text-white border-white'
                    : 'bg-white/90 text-green-800 border-dashed border-white'
                }`}
              >
                {player ? (player.jerseyNumber ?? '?') : slot.role}
              </div>
              <span
                className="text-[10px] text-white font-medium drop-shadow bg-black/40 px-1 rounded max-w-[70px] truncate"
                data-lineup-id={lineup?.id}
              >
                {player?.displayName ?? slot.role}
              </span>
            </button>
          );
        }}
      />

      {/* Bench */}
      <div className="bg-background rounded-lg p-3">
        <p className="text-xs font-semibold text-yellow-400 uppercase mb-2">
          Bench ({benchPool.length})
        </p>
        <div className="flex flex-wrap gap-2">
          {benchPool.length === 0 && (
            <p className="text-xs text-muted">No bench players</p>
          )}
          {benchPool.map((p) => {
            const subLineup = substituteLineups.find((l) => l.userId === p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 bg-card border border-border rounded-full px-3 py-1 text-xs ${
                  subLineup ? 'border-yellow-500/40' : 'opacity-75'
                }`}
              >
                <span className="font-bold text-primary">
                  #{p.jerseyNumber ?? '-'}
                </span>
                <span className="truncate max-w-[120px]">{p.displayName}</span>
                {subLineup && canManage && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSubstitute(p.id)}
                    className="text-danger hover:bg-danger/20 px-1 rounded"
                    aria-label={`Remove substitute ${p.displayName}`}
                  >
                    &times;
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {canManage && (
          <p className="text-[10px] text-muted mt-3">
            Tap a slot on the pitch to assign or change a player.
          </p>
        )}
      </div>

      {/* Slot-picker modal */}
      {activeSlot !== null && canManage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={
            activeSlotPlayer
              ? `Edit ${activeSlotPlayer.displayName}`
              : `Assign player to ${activeSlotRole}`
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
                <p className="text-xs text-muted">Slot: {activeSlotRole}</p>
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
                  onClick={() => void handleRemoveFromSlot()}
                  className="w-full px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg text-left mb-2"
                >
                  ↓ Move to bench
                </button>
              )}

              <p className="text-xs text-muted uppercase tracking-wide px-3 py-1">
                {activeSlotPlayer ? 'Swap with' : 'Choose player'}
              </p>
              {benchPool.length === 0 && (
                <p className="text-sm text-muted px-3 py-4">
                  No players available.
                </p>
              )}
              <ul>
                {benchPool.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => void handleAssign(p.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover text-left"
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                        #{p.jerseyNumber ?? '-'}
                      </span>
                      <span className="flex-1 text-sm">{p.displayName}</span>
                      {substituteLineups.some((l) => l.userId === p.id) && (
                        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                          SUB
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
