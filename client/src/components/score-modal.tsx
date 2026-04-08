'use client';

import { useEffect, useState } from 'react';
import { usersService, matchesService } from '@/services';
import { useConfirm } from '@/contexts/confirm-context';
import type { User, Match, MatchLineup } from '@/types';

interface GoalEntry {
  scorerId: string;
  assistId: string;
  minute: string;
}

interface LineupEntry {
  id?: string;
  userId: string;
  type: 'starting' | 'substitute';
}

interface ScoreModalProps {
  match: Match;
  teamName: string;
  canManage: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ScoreModal({ match, teamName, canManage, onClose, onSaved }: ScoreModalProps) {
  const confirmDialog = useConfirm();
  const [players, setPlayers] = useState<User[]>([]);
  const [homeScore, setHomeScore] = useState(match.homeScore?.toString() ?? '0');
  const [awayScore, setAwayScore] = useState(match.awayScore?.toString() ?? '0');
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [lineups, setLineups] = useState<LineupEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [p, existingGoals, existingLineups] = await Promise.all([
        usersService.getAll(),
        matchesService.getGoals(match.id),
        matchesService.getLineups(match.id),
      ]);
      setPlayers(p);

      if (existingGoals.length > 0) {
        setGoals(existingGoals.map((g) => ({
          scorerId: g.scorerId,
          assistId: g.assistId || '',
          minute: String(g.minute),
        })));
      }

      if (existingLineups.length > 0) {
        setLineups(existingLineups.map((l) => ({
          id: l.id,
          userId: l.userId,
          type: l.type as 'starting' | 'substitute',
        })));
      }

      setLoading(false);
    };
    load();
  }, [match.id]);

  // Lineup helpers
  const startingPlayers = lineups.filter((l) => l.type === 'starting');
  const substitutePlayers = lineups.filter((l) => l.type === 'substitute');
  const assignedIds = new Set(lineups.map((l) => l.userId));
  const availablePlayers = players.filter((p) => !assignedIds.has(p.id));

  const addToLineup = (userId: string, type: 'starting' | 'substitute') => {
    if (!userId) return;
    setLineups([...lineups, { userId, type }]);
  };

  const removeFromLineup = (userId: string) => {
    setLineups(lineups.filter((l) => l.userId !== userId));
  };

  // Goal helpers
  const addGoal = () => {
    setGoals([...goals, { scorerId: '', assistId: '', minute: '' }]);
  };

  const updateGoal = (index: number, field: keyof GoalEntry, value: string) => {
    setGoals(goals.map((g, i) => i === index ? { ...g, [field]: value } : g));
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
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
      status: 'completed',
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
        .filter((g) => g.scorerId && g.minute)
        .map((g) =>
          matchesService.addGoal({
            matchId: match.id,
            scorerId: g.scorerId,
            assistId: g.assistId || undefined,
            minute: Number(g.minute),
          }),
        ),
    );

    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      <div className="relative bg-card border border-border rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Match Detail</h2>
            <p className="text-xs text-muted">
              {new Date(match.matchDate).toLocaleDateString('vi-VN', {
                weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
              {' · '}{match.location}
            </p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground text-xl">&times;</button>
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
                    <input
                      type="number"
                      min={0}
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <div className="text-2xl font-bold">{homeScore}</div>
                  )}
                </div>
                <div className="text-center text-2xl font-bold text-muted">-</div>
                <div className="text-center">
                  <p className="text-xs text-muted mb-2">{match.opponent}</p>
                  {canManage ? (
                    <input
                      type="number"
                      min={0}
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full bg-card border border-border rounded-lg px-3 py-3 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-primary"
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
              <div className="grid grid-cols-2 gap-4">
                {/* Starting */}
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-primary uppercase">Starting ({startingPlayers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {startingPlayers.map((l) => (
                      <div key={l.userId} className="flex items-center justify-between text-sm py-1">
                        <span>{getPlayerName(l.userId)}</span>
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
                    <select
                      value=""
                      onChange={(e) => addToLineup(e.target.value, 'starting')}
                      className="mt-2 w-full bg-card border border-border rounded px-2 py-1.5 text-xs"
                    >
                      <option value="">+ Add starting...</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Substitutes */}
                <div className="bg-background rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-yellow-400 uppercase">Substitute ({substitutePlayers.length})</span>
                  </div>
                  <div className="space-y-1">
                    {substitutePlayers.map((l) => (
                      <div key={l.userId} className="flex items-center justify-between text-sm py-1">
                        <span>{getPlayerName(l.userId)}</span>
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
                    <select
                      value=""
                      onChange={(e) => addToLineup(e.target.value, 'substitute')}
                      className="mt-2 w-full bg-card border border-border rounded px-2 py-1.5 text-xs"
                    >
                      <option value="">+ Add substitute...</option>
                      {availablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>#{p.jerseyNumber} {p.displayName}</option>
                      ))}
                    </select>
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
                    <div key={i} className="bg-background rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted font-medium">Goal #{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeGoal(i)}
                          className="text-danger text-xs hover:bg-danger/20 px-1 rounded"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <select
                          value={goal.scorerId}
                          onChange={(e) => updateGoal(i, 'scorerId', e.target.value)}
                          className="col-span-2 bg-card border border-border rounded px-2 py-1.5 text-sm"
                        >
                          <option value="">Scorer *</option>
                          {players.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.jerseyNumber} {p.displayName}
                            </option>
                          ))}
                        </select>
                        <select
                          value={goal.assistId}
                          onChange={(e) => updateGoal(i, 'assistId', e.target.value)}
                          className="col-span-2 bg-card border border-border rounded px-2 py-1.5 text-sm"
                        >
                          <option value="">Assist</option>
                          {players
                            .filter((p) => p.id !== goal.scorerId)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                #{p.jerseyNumber} {p.displayName}
                              </option>
                            ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={120}
                          placeholder="Min"
                          value={goal.minute}
                          onChange={(e) => updateGoal(i, 'minute', e.target.value)}
                          className="bg-card border border-border rounded px-2 py-1.5 text-sm text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Read-only goals for player role */
                <div className="space-y-2">
                  {goals.map((goal, i) => (
                    <div key={i} className="bg-background rounded-lg p-2 flex items-center gap-3 text-sm">
                      <span className="text-muted text-xs w-10">{goal.minute}&apos;</span>
                      <span className="font-medium">{getPlayerName(goal.scorerId)}</span>
                      {goal.assistId && (
                        <span className="text-muted text-xs">(ast. {getPlayerName(goal.assistId)})</span>
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
