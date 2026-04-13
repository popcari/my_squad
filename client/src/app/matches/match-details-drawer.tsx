import type { UniformColors } from '@/components/football-pitch';
import { Drawer } from '@/components/ui/drawer';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { MATCH_STATUS } from '@/constant/enum';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  updateMatchSchema,
  type UpdateMatchForm,
} from '@/schemas/match.schema';
import {
  fundingService,
  matchesService,
  positionsService,
  userPositionsService,
} from '@/services';
import { formationsService } from '@/services/formations.service';
import { uniformsService } from '@/services/uniforms.service';
import type {
  Expense,
  Match,
  MatchGoal,
  MatchLineup,
  MatchStatus,
  Position,
  User,
  UserPosition,
} from '@/types';
import type { Formation } from '@/types/formation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { TacticsPanel } from './tactics-panel';

interface MatchDetailsDrawerProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  players: User[];
}

export function MatchDetailsDrawer({
  match,
  isOpen,
  onClose,
  onUpdated,
  players,
}: MatchDetailsDrawerProps) {
  const canManage = useCanManage();
  const [activeTab, setActiveTab] = useState<
    'info' | 'tactics' | 'goals' | 'expense'
  >('info');

  const [formations, setFormations] = useState<Formation[]>([]);
  const [selectedFormationId, setSelectedFormationId] = useState<string>('');
  const [positions, setPositions] = useState<Position[]>([]);
  const [userPositions, setUserPositions] = useState<UserPosition[]>([]);

  const formHook = useForm<UpdateMatchForm>({
    resolver: zodResolver(updateMatchSchema),
    mode: 'onTouched',
  });

  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [loadingLineups, setLoadingLineups] = useState(false);
  const [latestUniform, setLatestUniform] = useState<UniformColors | undefined>(
    undefined,
  );

  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [newGoalScorerId, setNewGoalScorerId] = useState('');
  const [newGoalAssistId, setNewGoalAssistId] = useState('');
  const [newGoalMinute, setNewGoalMinute] = useState('');
  const [deletedGoalIds, setDeletedGoalIds] = useState<string[]>([]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [deletedExpenseIds, setDeletedExpenseIds] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'tactics' && match) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch loads lineups/formations
      setLoadingLineups(true);
      Promise.all([
        matchesService.getLineups(match.id),
        formationsService.getAll(),
        positionsService.getAll(),
        Promise.all(players.map((p) => userPositionsService.getByUser(p.id))),
        uniformsService.getAll(),
      ])
        .then(([ls, fs, ps, upByUser, uniforms]) => {
          setLineups(ls);
          setFormations(fs);
          setPositions(ps);
          setUserPositions(upByUser.flat());
          if (!selectedFormationId && fs.length > 0) {
            setSelectedFormationId(fs[0].id);
          }
          if (uniforms.length > 0) {
            const latest = uniforms.reduce((a, b) =>
              b.year >= a.year ? b : a,
            );
            setLatestUniform({
              shirtColor: latest.shirtColor,
              pantColor: latest.pantColor,
              numberColor: latest.numberColor,
            });
          }
        })
        .finally(() => setLoadingLineups(false));
    } else if (activeTab === 'goals' && match) {
      setLoadingGoals(true);
      matchesService
        .getGoals(match.id)
        .then(setGoals)
        .finally(() => setLoadingGoals(false));
    } else if (activeTab === 'expense' && match) {
      setLoadingExpenses(true);
      fundingService
        .getExpenses()
        .then((allExp) =>
          setExpenses(allExp.filter((e) => e.matchId === match.id)),
        )
        .finally(() => setLoadingExpenses(false));
    }
  }, [activeTab, match, selectedFormationId, players]);

  /* eslint-disable react-hooks/set-state-in-effect -- reset UI state on match change */
  useEffect(() => {
    if (match && isOpen) {
      formHook.reset({
        opponent: match.opponent,
        matchDate: match.matchDate.slice(0, 10),
        location: match.location,
        status: match.status,
        homeScore: match.homeScore ?? null,
        awayScore: match.awayScore ?? null,
        notes: match.notes || '',
      });
      setDeletedGoalIds([]);
      setDeletedExpenseIds([]);
      setActiveTab('info');
    }
  }, [match, isOpen, formHook]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpdateMatch = async (data: UpdateMatchForm) => {
    if (!match) return;
    await matchesService.update(match.id, {
      ...data,
      status: data.status as MatchStatus,
      homeScore: data.homeScore ?? undefined,
      awayScore: data.awayScore ?? undefined,
    });
  };

  const isGoalChanged =
    goals.some((g) => g.id.startsWith('temp-')) || deletedGoalIds.length > 0;
  const isExpenseChanged =
    expenses.some((e) => e.id.startsWith('temp-')) ||
    deletedExpenseIds.length > 0;
  const hasPendingAdditions =
    (!!newGoalScorerId && !!newGoalMinute) ||
    (!!newExpenseDesc && !!newExpenseAmount);
  const hasUnsavedChanges =
    formHook.formState.isDirty ||
    hasPendingAdditions ||
    isGoalChanged ||
    isExpenseChanged;

  const handleGlobalSave = async () => {
    if (!match) return;
    const promises: Promise<unknown>[] = [];

    if (formHook.formState.isDirty) {
      const isValid = await formHook.trigger();
      if (isValid) {
        promises.push(
          handleUpdateMatch(formHook.getValues()).then(() => {
            formHook.reset(formHook.getValues()); // clear dirty state
          }),
        );
      } else {
        setActiveTab('info'); // switch to show errors
        return;
      }
    }

    // Process deleted Goals
    deletedGoalIds.forEach((id) =>
      promises.push(matchesService.removeGoal(id)),
    );
    setDeletedGoalIds([]);

    // Process new Goals
    goals
      .filter((g) => g.id.startsWith('temp-'))
      .forEach((g) => {
        promises.push(
          matchesService.addGoal({
            matchId: match.id,
            scorerId: g.scorerId,
            assistId: g.assistId || undefined,
            minute: g.minute,
          }),
        );
      });
    // The "un-added" goal inputs
    if (newGoalScorerId)
      promises.push(
        matchesService.addGoal({
          matchId: match.id,
          scorerId: newGoalScorerId,
          assistId: newGoalAssistId || undefined,
          minute: newGoalMinute ? Number(newGoalMinute) : null,
        }),
      );

    // Process deleted Expenses
    deletedExpenseIds.forEach((id) =>
      promises.push(fundingService.removeExpense(id)),
    );
    setDeletedExpenseIds([]);

    // Process new Expenses
    expenses
      .filter((e) => e.id.startsWith('temp-'))
      .forEach((e) => {
        promises.push(
          fundingService.addExpense({
            matchId: match.id,
            description: e.description,
            amount: e.amount,
            date: match.matchDate.split('T')[0],
          }),
        );
      });
    // The "un-added" expense inputs
    if (newExpenseDesc && newExpenseAmount)
      promises.push(
        fundingService.addExpense({
          matchId: match.id,
          description: newExpenseDesc,
          amount: Number(newExpenseAmount),
          date: match.matchDate.split('T')[0],
        }),
      );

    await Promise.all(promises);
    setNewGoalScorerId('');
    setNewGoalAssistId('');
    setNewGoalMinute('');
    setNewExpenseDesc('');
    setNewExpenseAmount('');

    // Reload local data
    const [fetchedGoals, fetchedExpenses] = await Promise.all([
      matchesService.getGoals(match.id),
      fundingService.getExpenses(),
    ]);
    setGoals(fetchedGoals);
    setExpenses(fetchedExpenses.filter((e) => e.matchId === match.id));

    // Fire external callback to update Dashboard charts and Match List
    onUpdated();
  };

  const handleAddLineup = async (data: {
    userId: string;
    type: 'starting' | 'substitute';
    slotIndex?: number | null;
  }) => {
    if (!match) return;
    const added = await matchesService.addLineup({
      matchId: match.id,
      ...data,
    });
    setLineups((prev) => [...prev, added]);
  };

  const handleUpdateLineup = async (
    id: string,
    data: Partial<Pick<MatchLineup, 'type' | 'slotIndex'>>,
  ) => {
    const updated = await matchesService.updateLineup(id, data);
    setLineups((prev) => prev.map((l) => (l.id === id ? updated : l)));
  };

  const handleRemoveLineup = async (lineupId: string) => {
    await matchesService.removeLineup(lineupId);
    setLineups((prev) => prev.filter((l) => l.id !== lineupId));
  };

  const handleAddGoal = () => {
    if (!match || !newGoalScorerId) return;
    const pendingGoal: MatchGoal = {
      id: `temp-${Date.now()}`,
      matchId: match.id,
      scorerId: newGoalScorerId,
      assistId: newGoalAssistId || undefined,
      minute: newGoalMinute ? Number(newGoalMinute) : null,
      createdAt: new Date().toISOString(),
    };
    setGoals([...goals, pendingGoal]);
    setNewGoalScorerId('');
    setNewGoalAssistId('');
    setNewGoalMinute('');
  };

  const handleRemoveGoal = (id: string) => {
    if (!id.startsWith('temp-')) {
      setDeletedGoalIds([...deletedGoalIds, id]);
    }
    setGoals(goals.filter((g) => g.id !== id));
  };

  const handleAddExpense = () => {
    if (!match || !newExpenseDesc || !newExpenseAmount) return;
    const pendingExpense: Expense = {
      id: `temp-${Date.now()}`,
      matchId: match.id,
      description: newExpenseDesc,
      amount: Number(newExpenseAmount),
      date: match.matchDate.split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setExpenses([...expenses, pendingExpense]);
    setNewExpenseDesc('');
    setNewExpenseAmount('');
  };

  const handleRemoveExpense = (id: string) => {
    if (!id.startsWith('temp-')) {
      setDeletedExpenseIds([...deletedExpenseIds, id]);
    }
    setExpenses(expenses.filter((e) => e.id !== id));
  };

  if (!match) return null;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Match vs ${match.opponent}`}
    >
      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border mb-4 overflow-x-auto">
        {(['info', 'tactics', 'goals', 'expense'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground hover:border-muted'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="pb-8">
        {activeTab === 'info' && (
          <form
            className="space-y-4"
            onSubmit={formHook.handleSubmit(handleUpdateMatch)}
          >
            <div className="grid grid-cols-2 gap-4">
              <InputText
                label="Opponent"
                error={formHook.formState.errors.opponent}
                required
                disabled={!canManage}
                {...formHook.register('opponent')}
              />
              <InputText
                type="date"
                label="Match Date"
                error={formHook.formState.errors.matchDate}
                required
                disabled={!canManage}
                {...formHook.register('matchDate')}
              />
            </div>

            <InputText
              label="Location"
              error={formHook.formState.errors.location}
              required
              disabled={!canManage}
              {...formHook.register('location')}
            />

            <div className="grid grid-cols-2 gap-4">
              <InputText
                type="number"
                label="Home Score (Us)"
                error={formHook.formState.errors.homeScore}
                min="0"
                disabled={!canManage}
                {...formHook.register('homeScore', { valueAsNumber: true })}
              />
              <InputText
                type="number"
                label="Away Score"
                error={formHook.formState.errors.awayScore}
                min="0"
                disabled={!canManage}
                {...formHook.register('awayScore', { valueAsNumber: true })}
              />
            </div>

            <Controller
              name="status"
              control={formHook.control}
              render={({ field }) => (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status *</label>
                  <Select
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    disabled={!canManage}
                  >
                    {Object.values(MATCH_STATUS).map((status) => (
                      <option key={status} value={status}>
                        {status.replace('_', ' ')}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            />

            <InputText
              label="Notes"
              error={formHook.formState.errors.notes}
              disabled={!canManage}
              {...formHook.register('notes')}
            />

            {/* The old submit button is removed, logic is moved to the global footer */}
          </form>
        )}

        {activeTab === 'tactics' && (
          <TacticsPanel
            loading={loadingLineups}
            players={players}
            lineups={lineups}
            formations={formations}
            selectedFormationId={selectedFormationId}
            onFormationChange={setSelectedFormationId}
            canManage={canManage}
            positions={positions}
            userPositions={userPositions}
            uniform={latestUniform}
            onAddLineup={handleAddLineup}
            onUpdateLineup={handleUpdateLineup}
            onRemoveLineup={handleRemoveLineup}
          />
        )}

        {activeTab === 'goals' && (
          <div className="space-y-6">
            {canManage && (
              <div className="bg-card-hover p-4 rounded-lg flex flex-col md:flex-row gap-2 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label
                    className="text-sm font-medium"
                    htmlFor="goal-scorer-select"
                  >
                    Scorer *
                  </label>
                  <Select
                    id="goal-scorer-select"
                    value={newGoalScorerId}
                    onChange={(e) => setNewGoalScorerId(e.target.value)}
                  >
                    <option value="">Select scorer...</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label
                    className="text-sm font-medium"
                    htmlFor="goal-assist-select"
                  >
                    Assist
                  </label>
                  <Select
                    id="goal-assist-select"
                    value={newGoalAssistId}
                    onChange={(e) => setNewGoalAssistId(e.target.value)}
                  >
                    <option value="">None</option>
                    {players
                      .filter((p) => p.id !== newGoalScorerId)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                  </Select>
                </div>
                <div className="w-24 space-y-1">
                  <label
                    className="text-sm font-medium"
                    htmlFor="goal-minute-input"
                  >
                    Minute *
                  </label>
                  <InputText
                    id="goal-minute-input"
                    type="number"
                    min="1"
                    max="120"
                    placeholder="e.g. 15"
                    value={newGoalMinute}
                    onChange={(e) => setNewGoalMinute(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAddGoal}
                  disabled={!newGoalScorerId || !newGoalMinute}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm w-full md:w-auto disabled:opacity-50"
                  style={{ height: '42px' }}
                >
                  Add
                </button>
              </div>
            )}

            {loadingGoals ? (
              <div className="text-center py-4 text-muted">Loading...</div>
            ) : goals.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No goals recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {goals
                  .sort(
                    (a, b) => (a.minute ?? Infinity) - (b.minute ?? Infinity),
                  )
                  .map((g) => {
                    const scorer = players.find((p) => p.id === g.scorerId);
                    const assist = players.find((p) => p.id === g.assistId);
                    return (
                      <div
                        key={g.id}
                        className="flex justify-between items-center p-3 bg-card-hover rounded-lg border border-border"
                      >
                        <div>
                          <span className="font-medium text-primary">
                            ⚽ {scorer?.displayName || g.scorerId}
                          </span>
                          {assist && (
                            <span className="text-sm text-muted ml-2">
                              (Assist: {assist.displayName})
                            </span>
                          )}
                          {g.id.startsWith('temp-') && (
                            <span className="ml-2 text-xs text-amber-500 font-medium italic">
                              (Pending)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-muted">
                            {g.minute != null ? `${g.minute}'` : '-'}
                          </span>
                          {canManage && (
                            <button
                              onClick={() => handleRemoveGoal(g.id)}
                              className="text-danger text-xs hover:bg-danger/20 px-1 rounded transition-colors"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'expense' && (
          <div className="space-y-6">
            {canManage && (
              <div className="bg-card-hover p-4 rounded-lg flex flex-col md:flex-row gap-2 items-end">
                <div className="flex-1 w-full space-y-1">
                  <label
                    className="text-sm font-medium"
                    htmlFor="expense-desc-input"
                  >
                    Description *
                  </label>
                  <InputText
                    id="expense-desc-input"
                    placeholder="e.g. Pitch fee, drinks..."
                    value={newExpenseDesc}
                    onChange={(e) => setNewExpenseDesc(e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full space-y-1">
                  <label
                    className="text-sm font-medium"
                    htmlFor="expense-amount-input"
                  >
                    Amount (VND) *
                  </label>
                  <InputText
                    id="expense-amount-input"
                    type="number"
                    min="1000"
                    placeholder="e.g. 500000"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAddExpense}
                  disabled={!newExpenseDesc || !newExpenseAmount}
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm w-full md:w-auto disabled:opacity-50"
                  style={{ height: '42px' }}
                >
                  Add
                </button>
              </div>
            )}

            {loadingExpenses ? (
              <div className="text-center py-4 text-muted">Loading...</div>
            ) : expenses.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No expenses recorded yet.
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex justify-between items-center p-3 bg-card-hover rounded-lg border border-border"
                  >
                    <div>
                      <span className="font-medium">{exp.description}</span>
                      {exp.id.startsWith('temp-') && (
                        <span className="ml-2 text-xs text-amber-500 font-medium italic">
                          (Pending)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-danger">
                        -{exp.amount.toLocaleString('vi-VN')}đ
                      </span>
                      {canManage && (
                        <button
                          onClick={() => handleRemoveExpense(exp.id)}
                          className="text-danger text-xs hover:bg-danger/20 px-1 rounded transition-colors"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Global Save Footer */}
      {hasUnsavedChanges && canManage && (
        <div className="sticky bottom-0 bg-card p-4 border-t border-border mt-4 -mx-4 -mb-4 flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom border-t shadow-lg z-10 transition-colors">
          <div className="text-sm text-amber-500 font-medium">
            ⚠️ You have unsaved changes (
            {[
              formHook.formState.isDirty && 'Match Info',
              (isGoalChanged || (!!newGoalScorerId && !!newGoalMinute)) &&
                'Goals',
              (isExpenseChanged || (!!newExpenseDesc && !!newExpenseAmount)) &&
                'Expenses',
            ]
              .filter(Boolean)
              .join(', ')}
            )
          </div>
          <button
            onClick={handleGlobalSave}
            disabled={formHook.formState.isSubmitting}
            className="w-full md:w-auto bg-primary hover:bg-primary-hover text-white px-8 py-2.5 rounded-lg font-medium shadow-md transition-colors"
          >
            {formHook.formState.isSubmitting ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      )}
    </Drawer>
  );
}
