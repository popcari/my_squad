'use client';

import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { CloseButton } from '@/components/ui/close-button';
import { LINEUP_TYPE, MATCH_STATUS } from '@/constant/enum';
import { POSITION_GROUPS } from '@/constant';
import { useConfirm } from '@/contexts/confirm-context';
import { matchesService, usersService, positionsService, userPositionsService } from '@/services';
import type { LineupType, Match, User, Position, UserPosition } from '@/types';
import { useEffect, useState } from 'react';

interface GoalEntry {
  scorerId: string;
  assistId: string;
  minute: string;
}

interface LineupEntry {
  id?: string;
  userId: string;
  type: LineupType;
}

interface ScoreModalProps {
  match: Match;
  teamName: string;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ScoreModal({
  match,
  teamName,
  canManage,
  onClose,
  onSaved,
}: ScoreModalProps) {
  const confirmDialog = useConfirm();
  const [players, setPlayers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);
  const [homeScore, setHomeScore] = useState(
    match.homeScore?.toString() ?? '0',
  );
  const [awayScore, setAwayScore] = useState(
    match.awayScore?.toString() ?? '0',
  );
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [lineups, setLineups] = useState<LineupEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, existingGoals, existingLineups, pos] = await Promise.all([
        usersService.getAll(),
        matchesService.getGoals(match.id),
        matchesService.getLineups(match.id),
        positionsService.getAll(),
      ]);

      const upResults = await Promise.all(
        p.map((u) => userPositionsService.getByUser(u.id)),
      );

      setPlayers(p);
      setPositions(pos);
      setUserPositions(upResults.flat());

      if (existingGoals.length > 0) {
        setGoals(
          existingGoals.map((g) => ({
            scorerId: g.scorerId,
            assistId: g.assistId || '',
            minute: g.minute != null ? String(g.minute) : '',
          })),
        );
      }

      if (existingLineups.length > 0) {
        setLineups(
          existingLineups.map((l) => ({
            id: l.id,
            userId: l.userId,
            type: l.type as LineupType,
          })),
        );
      }

      setLoading(false);
    };
    load();
  }, [match.id]);

  // Position helpers (must be declared before usage in sort)
  const getPrimaryPosition = (userId: string) => {
    const pUp = userPositions.find(
      (up) => up.userId === userId && up.type === 'primary',
    );
    if (!pUp) return null;
    return positions.find((p) => p.id === pUp.positionId) || null;
  };

  const getPositionWeight = (pos?: Position | null) => {
    if (!pos) return POSITION_GROUPS.UNKNOWN.weight;
    const name = pos.name.toUpperCase();
    for (const group of Object.values(POSITION_GROUPS)) {
      if (group.roles.includes(name)) return group.weight;
    }
    return POSITION_GROUPS.UNKNOWN.weight;
  };

  // Lineup helpers
  const startingPlayers = [...lineups]
    .filter((l) => l.type === LINEUP_TYPE.STARTING)
    .sort((a, b) => {
      const posA = getPrimaryPosition(a.userId);
      const posB = getPrimaryPosition(b.userId);
      return getPositionWeight(posA) - getPositionWeight(posB);
    });

  const substitutePlayers = [...lineups]
    .filter((l) => l.type === LINEUP_TYPE.SUBSTITUTE)
    .sort((a, b) => {
      const posA = getPrimaryPosition(a.userId);
      const posB = getPrimaryPosition(b.userId);
      return getPositionWeight(posA) - getPositionWeight(posB);
    });
  const assignedIds = new Set(lineups.map((l) => l.userId));
  const availablePlayers = players.filter((p) => !assignedIds.has(p.id));

  const addToLineup = (userId: string, type: LineupType) => {
    if (!userId) return;
    setLineups([...lineups, { userId, type }]);
  };

  const removeFromLineup = (userId: string) => {
    setLineups(lineups.filter((l) => l.userId !== userId));
  };

  // Goal helpers
  const handleHomeScoreChange = (val: string) => {
    setHomeScore(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 0) {
      setGoals((prev) => {
        if (num === prev.length) return prev;
        if (num > prev.length) {
          const toAdd = num - prev.length;
          return [...prev, ...Array.from({ length: toAdd }, () => ({ scorerId: '', assistId: '', minute: '' }))];
        } else {
          return prev.slice(0, num);
        }
      });
    } else {
      setGoals([]);
    }
  };

  const addGoal = () => {
    setGoals([...goals, { scorerId: '', assistId: '', minute: '' }]);
  };

  const updateGoal = (index: number, field: keyof GoalEntry, value: string) => {
    setGoals(goals.map((g, i) => (i === index ? { ...g, [field]: value } : g)));
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const getPositionBadge = (pos?: Position | null) => {
    if (!pos) return null;
    const name = pos.name.toUpperCase();
    let colorClass = POSITION_GROUPS.UNKNOWN.colorClass;
    
    for (const group of Object.values(POSITION_GROUPS)) {
      if (group.roles.includes(name)) {
        colorClass = group.colorClass;
        break;
      }
    }

    return (
      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colorClass}`}>
        {name}
      </span>
    );
  };

  const getPlayerName = (id: string) => {
    const p = players.find((pl) => pl.id === id);
    return p ? `#${p.jerseyNumber} ${p.displayName}` : id;
  };

  const handleSave = async () => {
    const ok = await confirmDialog({
      title: 'Save Match Result',
      message: `Save result ${homeScore} - ${awayScore}?`,
      confirmText: 'Save',
    });
    if (!ok) return;
    setSaving(true);

    // Update match score
    await matchesService.update(match.id, {
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      status: MATCH_STATUS.COMPLETED,
    });

    // Delete existing lineups & goals, then re-save
    const [existingLineups, existingGoals] = await Promise.all([
      matchesService.getLineups(match.id),
      matchesService.getGoals(match.id),
    ]);

    await Promise.all([
      ...existingLineups.map((l) => matchesService.removeLineup(l.id)),
      ...existingGoals.map((g) => matchesService.removeGoal(g.id)),
    ]);

    // Save lineups
    await Promise.all(
      lineups.map((l) =>
        matchesService.addLineup({
          matchId: match.id,
          userId: l.userId,
          type: l.type,
        }),
      ),
    );

    // Save goals
    await Promise.all(
      goals
        .filter((g) => g.scorerId)
        .map((g) =>
          matchesService.addGoal({
            matchId: match.id,
            scorerId: g.scorerId,
            assistId: g.assistId || undefined,
            minute: g.minute ? Number(g.minute) : null,
          }),
        ),
    );

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl p-6 w-[90%] md:w-full md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Match Detail</h2>
            <p className="text-xs text-muted">
              {new Date(match.matchDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
              {' · '}
              {match.location}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        {loading ? (
          <p className="text-muted py-8 text-center">Loading...</p>
        ) : (
          <>
            {/* Score */}
            <div className="bg-background rounded-lg p-4 mb-6">
              <div className="grid grid-cols-3 items-center gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted mb-2">{teamName}</p>
                  {canManage ? (
                    <InputText
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={(e) => handleHomeScoreChange(e.target.value)}
                      className="text-2xl font-bold text-center"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{homeScore}</div>
                  )}
                </div>
                <div className="text-center text-2xl font-bold text-muted align-self-end h-[38px]">
                  -
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-2">{match.opponent}</p>
                  {canManage ? (
                    <InputText
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="text-2xl font-bold text-center"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{awayScore}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Lineups */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold mb-3">Lineups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Starting */}
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary uppercase">
                      Starting ({startingPlayers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {startingPlayers.map((l) => (
                      <div
                        key={l.userId}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <div className="flex items-center gap-2">
                          {getPositionBadge(getPrimaryPosition(l.userId))}
                          <span className="truncate max-w-[120px] md:max-w-[150px]">
                            {getPlayerName(l.userId)}
                          </span>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => removeFromLineup(l.userId)}
                            className="text-danger text-xs hover:bg-danger/20 px-1 rounded"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    {startingPlayers.length === 0 && (
                      <p className="text-xs text-muted">No players</p>
                    )}
                  </div>
                  {canManage && availablePlayers.length > 0 && (
                    <Select
                      value=""
                      onChange={(e) =>
                        addToLineup(e.target.value, LINEUP_TYPE.STARTING)
                      }
                      className="mt-2 text-xs w-full"
                      keepOpen
                    >
                      <option value="">+ Add starting...</option>
                      {availablePlayers.map((p) => {
                        const pos = getPrimaryPosition(p.id);
                        return (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber} {p.displayName} {pos ? `(${pos.name})` : ''}
                          </option>
                        );
                      })}
                    </Select>
                  )}
                </div>

                {/* Substitutes */}
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-yellow-400 uppercase">
                      Substitute ({substitutePlayers.length})
                    </span>
                  </div>
                  <div className="space-y-1">
                    {substitutePlayers.map((l) => (
                      <div
                        key={l.userId}
                        className="flex items-center justify-between text-sm py-1"
                      >
                        <div className="flex items-center gap-2">
                          {getPositionBadge(getPrimaryPosition(l.userId))}
                          <span className="truncate max-w-[120px] md:max-w-[150px]">
                            {getPlayerName(l.userId)}
                          </span>
                        </div>
                        {canManage && (
                          <button
                            onClick={() => removeFromLineup(l.userId)}
                            className="text-danger text-xs hover:bg-danger/20 px-1 rounded"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                    {substitutePlayers.length === 0 && (
                      <p className="text-xs text-muted">No players</p>
                    )}
                  </div>
                  {canManage && availablePlayers.length > 0 && (
                    <Select
                      value=""
                      onChange={(e) =>
                        addToLineup(e.target.value, LINEUP_TYPE.SUBSTITUTE)
                      }
                      className="mt-2 text-xs w-full"
                      keepOpen
                    >
                      <option value="">+ Add substitute...</option>
                      {availablePlayers.map((p) => {
                        const pos = getPrimaryPosition(p.id);
                        return (
                          <option key={p.id} value={p.id}>
                            #{p.jerseyNumber} {p.displayName} {pos ? `(${pos.name})` : ''}
                          </option>
                        );
                      })}
                    </Select>
                  )}
                </div>
              </div>
            </div>

            {/* Goals */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Goals</h3>
                {canManage && (
                  <button
                    type="button"
                    onClick={addGoal}
                    className="text-xs text-primary hover:text-primary-hover font-medium"
                  >
                    + Add Goal
                  </button>
                )}
              </div>

              {goals.length === 0 ? (
                <p className="text-xs text-muted">No goals.</p>
              ) : canManage ? (
                <div className="space-y-3">
                  {goals.map((goal, i) => (
                    <div
                      key={i}
                      className="bg-background rounded-lg p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted font-medium">
                          Goal #{i + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeGoal(i)}
                          className="text-danger text-xs hover:bg-danger/20 px-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <Select
                          value={goal.scorerId}
                          onChange={(e) =>
                            updateGoal(i, 'scorerId', e.target.value)
                          }
                          className="col-span-2 text-sm"
                        >
                          <option value="">Scorer *</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.jerseyNumber} {p.displayName}
                            </option>
                          ))}
                        </Select>
                        <Select
                          value={goal.assistId}
                          onChange={(e) =>
                            updateGoal(i, 'assistId', e.target.value)
                          }
                          className="col-span-2 text-sm"
                        >
                          <option value="">Assist</option>
                          {players
                            .filter((p) => p.id !== goal.scorerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.displayName}
                              </option>
                            ))}
                        </Select>
                        <InputText
                          type="number"
                          min={1}
                          max={120}
                          placeholder="Min"
                          value={goal.minute}
                          onChange={(e) =>
                            updateGoal(i, 'minute', e.target.value)
                          }
                          className="text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Read-only goals for player role */
                <div className="space-y-2">
                  {goals.map((goal, i) => (
                    <div
                      key={i}
                      className="bg-background rounded-lg p-2 flex items-center gap-3 text-sm"
                    >
                      <span className="text-muted text-xs w-10">
                        {goal.minute ? `${goal.minute}'` : '-'}
                      </span>
                      <span className="font-medium">
                        {getPlayerName(goal.scorerId)}
                      </span>
                      {goal.assistId && (
                        <span className="text-muted text-xs">
                          (ast. {getPlayerName(goal.assistId)})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {canManage ? (
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-card-hover hover:bg-border text-foreground rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-2.5 bg-card-hover hover:bg-border text-foreground rounded-lg text-sm transition-colors"
              >
                Close
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
