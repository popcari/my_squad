'use client';

import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { VN_CURRENCY } from '@/constant';
import { CONTRIBUTION_TYPE } from '@/constant/enum';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import { matchesService, usersService } from '@/services';
import { fundingService } from '@/services/funding.service';
import type {
  Contribution,
  Expense,
  FundingRound,
  FundingSummary,
  Match,
  User,
} from '@/types';
import { useEffect, useState } from 'react';
import { ContributionChart } from './contribution-chart';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export default function FundingPage() {
  const canManage = useCanManage();
  const confirm = useConfirm();

  const [summary, setSummary] = useState<FundingSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [rounds, setRounds] = useState<FundingRound[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [roundName, setRoundName] = useState('');
  const [editingRound, setEditingRound] = useState<string | null>(null);
  const [editRoundName, setEditRoundName] = useState('');

  // Contribution batch form
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribAmounts, setContribAmounts] = useState<Record<string, string>>(
    {},
  );
  const [contribTypes, setContribTypes] = useState<
    Record<string, `${CONTRIBUTION_TYPE}`>
  >({});
  const [contribDate, setContribDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [contribNote, setContribNote] = useState('');

  // Expense form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Expense month filter (YYYY-MM or '' for all)
  const [expenseMonth, setExpenseMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Match expense form
  const [showMatchExpenseForm, setShowMatchExpenseForm] = useState(false);
  const [matchExpenseForm, setMatchExpenseForm] = useState({
    matchId: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
  });

  // Editing expense
  const [editingExpense, setEditingExpense] = useState<string | null>(null);
  const [editExpenseForm, setEditExpenseForm] = useState({
    description: '',
    amount: '',
    date: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r, c, e, p, m] = await Promise.all([
        fundingService.getSummary(),
        fundingService.getRounds(),
        fundingService.getContributions(),
        fundingService.getExpenses(),
        usersService.getAll(),
        matchesService.getAll(),
      ]);
      setSummary(s);
      setRounds(r);
      setContributions(c);
      setExpenses(e);
      setPlayers(p);
      setMatches(m);
    } catch {
      // handle errors silently
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter contributions by selected round
  const filteredContributions = selectedRound
    ? contributions.filter((c) => c.roundId === selectedRound)
    : contributions;

  // Matches that don't have expenses yet
  const availableMatches = matches.filter(
    (m) => !expenses.some((e) => e.matchId === m.id),
  );

  // Matches that already have expenses (for editing)
  const expensedMatches = matches.filter((m) =>
    expenses.some((e) => e.matchId === m.id),
  );

  const getMatchExpense = (matchId: string) =>
    expenses.find((e) => e.matchId === matchId);

  // Filter expenses by month
  const filteredExpenses = expenseMonth
    ? expenses.filter((e) => e.date.slice(0, 7) === expenseMonth)
    : expenses;

  const monthTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Get unique months from expenses for the picker
  const expenseMonths = [...new Set(expenses.map((e) => e.date.slice(0, 7)))]
    .sort()
    .reverse();

  // ─── HANDLERS ───────────────────────────────────────────

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundName.trim()) return;
    await fundingService.createRound({ name: roundName.trim() });
    setRoundName('');
    setShowRoundForm(false);
    loadData();
  };

  const handleUpdateRound = async (id: string) => {
    if (!editRoundName.trim()) return;
    await fundingService.updateRound(id, { name: editRoundName.trim() });
    setEditingRound(null);
    loadData();
  };

  const handleDeleteRound = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Funding Round',
      message:
        'Deleting this round will remove all related contributions. Are you sure?',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await fundingService.removeRound(id);
    if (selectedRound === id) setSelectedRound(null);
    loadData();
  };

  const handleAddContributions = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound) return;

    // Only submit for players with non-zero amounts
    const entries = Object.entries(contribAmounts).filter(
      ([, amt]) => amt && Number(amt) > 0,
    );
    if (entries.length === 0) return;

    await Promise.all(
      entries.map(([userId, amount]) =>
        fundingService.addContribution({
          roundId: selectedRound,
          userId,
          amount: Number(amount),
          type: contribTypes[userId] || CONTRIBUTION_TYPE.RECURRING,
          note: contribNote || undefined,
          date: contribDate,
        }),
      ),
    );
    setContribAmounts({});
    setContribTypes({});
    setContribNote('');
    setShowContribForm(false);
    loadData();
  };

  const handleDeleteContribution = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Contribution',
      message: 'Are you sure you want to delete this contribution?',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await fundingService.removeContribution(id);
    loadData();
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.description || !expenseForm.amount) return;
    await fundingService.addExpense({
      description: expenseForm.description,
      amount: Number(expenseForm.amount),
      date: expenseForm.date,
    });
    setExpenseForm({
      description: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowExpenseForm(false);
    loadData();
  };

  const handleAddMatchExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchExpenseForm.matchId || !matchExpenseForm.amount) return;
    const match = matches.find((m) => m.id === matchExpenseForm.matchId);
    await fundingService.addExpense({
      description: `Match vs ${match?.opponent || 'N/A'}`,
      amount: Number(matchExpenseForm.amount),
      date: matchExpenseForm.date,
      matchId: matchExpenseForm.matchId,
    });
    setMatchExpenseForm({
      matchId: '',
      amount: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowMatchExpenseForm(false);
    loadData();
  };

  const handleStartEditExpense = (exp: Expense) => {
    setEditingExpense(exp.id);
    setEditExpenseForm({
      description: exp.description,
      amount: String(exp.amount),
      date: exp.date.slice(0, 10),
    });
  };

  const handleSaveEditExpense = async (id: string) => {
    await fundingService.updateExpense(id, {
      description: editExpenseForm.description,
      amount: Number(editExpenseForm.amount),
      date: editExpenseForm.date,
    });
    setEditingExpense(null);
    loadData();
  };

  const handleDeleteExpense = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Expense',
      message: 'Are you sure you want to delete this expense?',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await fundingService.removeExpense(id);
    loadData();
  };

  const getPlayerName = (userId: string) => {
    const player = players.find((p) => p.id === userId);
    return player?.displayName || userId;
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Team Funding</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Team Funding</h1>

      {/* ─── SUMMARY CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
        {[
          {
            label: 'Total Funding',
            testId: 'summary-income',
            value: summary.totalIncome,
            color: 'text-accent',
          },
          {
            label: 'Total Expense',
            testId: 'summary-expense',
            value: summary.totalExpense,
            color: 'text-danger',
          },
          {
            label: 'Balance',
            testId: 'summary-balance',
            value: summary.balance,
            color: summary.balance >= 0 ? 'text-primary' : 'text-danger',
          },
        ].map((card) => (
          <div
            key={card.testId}
            className="bg-card rounded-lg p-2 md:p-5 border border-border"
          >
            <p className="text-[10px] md:text-lg text-muted uppercase tracking-wider font-bold mb-1">
              {card.label}
            </p>
            <p
              data-testid={card.testId}
              className={`text-md md:text-2xl font-bold ${card.color}`}
            >
              {formatVND(card.value)}
            </p>
          </div>
        ))}
      </div>

      {/* ─── CONTRIBUTION CHART ─────────────────────────────── */}
      <ContributionChart
        contributions={contributions}
        rounds={rounds}
        players={players}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── LEFT: ROUNDS & CONTRIBUTIONS ────────────────── */}
        <div className="space-y-4">
          {/* Rounds Section */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Funding Rounds</h2>
              {canManage && (
                <button
                  onClick={() => setShowRoundForm(!showRoundForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                  aria-label="Create Round"
                >
                  {showRoundForm ? '✕ Cancel' : '+ Create Round'}
                </button>
              )}
            </div>

            {showRoundForm && (
              <form onSubmit={handleCreateRound} className="flex gap-2 mb-3">
                <InputText
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Round Name (e.g., Round 1 - April)"
                  className="flex-1"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Create
                </button>
              </form>
            )}

            {rounds.length === 0 ? (
              <p className="text-sm text-muted">No funding rounds yet.</p>
            ) : (
              <div className="space-y-2">
                {rounds.map((r) => (
                  <div
                    key={r.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedRound === r.id
                        ? 'bg-primary/20 border border-primary/40'
                        : 'bg-card-hover hover:bg-border/50'
                    }`}
                    onClick={() =>
                      setSelectedRound(selectedRound === r.id ? null : r.id)
                    }
                  >
                    {editingRound === r.id ? (
                      <div
                        className="flex gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <InputText
                          value={editRoundName}
                          onChange={(e) => setEditRoundName(e.target.value)}
                          className="flex-1 min-w-[200px]"
                        />
                        <button
                          onClick={() => handleUpdateRound(r.id)}
                          className="text-xs text-accent hover:text-accent/80"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingRound(null)}
                          className="text-xs text-muted hover:text-foreground"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">{r.name}</span>
                          <span className="text-xs text-muted ml-2">
                            {
                              contributions.filter((c) => c.roundId === r.id)
                                .length
                            }{' '}
                            contributions
                          </span>
                        </div>
                        {canManage && (
                          <div
                            className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => {
                                setEditingRound(r.id);
                                setEditRoundName(r.name);
                              }}
                              className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRound(r.id)}
                              className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contributions for selected round */}
          {selectedRound && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">
                  Contributions —{' '}
                  {rounds.find((r) => r.id === selectedRound)?.name}
                </h3>
                {canManage && (
                  <button
                    onClick={() => setShowContribForm(!showContribForm)}
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    {showContribForm ? '✕ Cancel' : '+ Add'}
                  </button>
                )}
              </div>

              {showContribForm && (
                <form
                  onSubmit={handleAddContributions}
                  className="space-y-3 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  {/* Shared settings row */}
                  <div className="flex flex-wrap gap-2 items-center mb-2">
                    <InputText
                      type="date"
                      value={contribDate}
                      onChange={(e) => setContribDate(e.target.value)}
                      className="w-48"
                      required
                    />
                  </div>

                  {/* Player grid */}
                  <div className="space-y-1.5">
                    {players.map((p) => {
                      const existing = filteredContributions.find(
                        (c) => c.userId === p.id,
                      );
                      return (
                        <div
                          key={p.id}
                          className={`flex items-center gap-2 p-2 rounded-lg ${
                            existing
                              ? 'bg-accent/10 border border-accent/20'
                              : 'bg-card border border-border'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium truncate block">
                              {p.displayName}
                            </span>
                            {existing && (
                              <span className="text-[10px] text-accent">
                                Contributed {formatVND(existing.amount)}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 items-center">
                            <Select
                              value={
                                contribTypes[p.id] ||
                                CONTRIBUTION_TYPE.RECURRING
                              }
                              onChange={(e) =>
                                setContribTypes({
                                  ...contribTypes,
                                  [p.id]: e.target
                                    .value as `${CONTRIBUTION_TYPE}`,
                                })
                              }
                              className="w-[115px] text-sm"
                            >
                              <option value={CONTRIBUTION_TYPE.RECURRING}>
                                Recurring
                              </option>
                              <option value={CONTRIBUTION_TYPE.DONATION}>
                                Donation
                              </option>
                            </Select>
                            <InputText
                              type="number"
                              placeholder="0"
                              value={contribAmounts[p.id] || ''}
                              onChange={(e) =>
                                setContribAmounts({
                                  ...contribAmounts,
                                  [p.id]: e.target.value,
                                })
                              }
                              className="w-28 text-right"
                              min="0"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <InputText
                    placeholder="General Note (optional)"
                    value={contribNote}
                    onChange={(e) => setContribNote(e.target.value)}
                  />

                  <button
                    type="submit"
                    disabled={
                      !Object.values(contribAmounts).some(
                        (v) => v && Number(v) > 0,
                      )
                    }
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    Save Contributions (
                    {
                      Object.values(contribAmounts).filter(
                        (v) => v && Number(v) > 0,
                      ).length
                    }{' '}
                    people)
                  </button>
                </form>
              )}

              {filteredContributions.length === 0 ? (
                <p className="text-sm text-muted">
                  No contributions for this round yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted text-xs border-b border-border">
                        <th className="pb-2 pr-3">Member</th>
                        <th className="pb-2 pr-3">Amount</th>
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Date</th>
                        <th className="pb-2 pr-3">Note</th>
                        {canManage && <th className="pb-2"></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContributions.map((c) => (
                        <tr
                          key={c.id}
                          className="border-b border-border/50 hover:bg-card-hover/50"
                        >
                          <td className="py-2 pr-3">
                            {getPlayerName(c.userId)}
                          </td>
                          <td className="py-2 pr-3 font-medium text-accent">
                            {formatVND(c.amount)}
                          </td>
                          <td className="py-2 pr-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                c.type === CONTRIBUTION_TYPE.RECURRING
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-accent/20 text-accent'
                              }`}
                            >
                              {c.type === CONTRIBUTION_TYPE.RECURRING
                                ? 'Recurring'
                                : 'Donation'}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-muted">
                            {new Date(c.date).toLocaleDateString('en-US')}
                          </td>
                          <td className="py-2 pr-3 text-muted text-xs">
                            {c.note || '—'}
                          </td>
                          {canManage && (
                            <td className="py-2">
                              <button
                                onClick={() => handleDeleteContribution(c.id)}
                                className="text-xs text-danger hover:text-danger/80"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-semibold">
                        <td className="pt-2 pr-3">Total</td>
                        <td className="pt-2 pr-3 text-accent">
                          {formatVND(
                            filteredContributions.reduce(
                              (sum, c) => sum + c.amount,
                              0,
                            ),
                          )}
                        </td>
                        <td colSpan={4}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── RIGHT: EXPENSES ─────────────────────────────── */}
        <div className="space-y-4">
          {/* General Expenses */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Expenses</h2>
              {canManage && (
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showExpenseForm ? '✕ Cancel' : '+ Add Expense'}
                </button>
              )}
            </div>

            {/* Month filter */}
            <div className="flex items-center gap-2 mb-3">
              <Select
                value={expenseMonth}
                onChange={(e) => setExpenseMonth(e.target.value)}
                className="text-sm"
              >
                <option value="">All</option>
                {expenseMonths.map((m) => (
                  <option key={m} value={m}>
                    {`${m.split('-')[1]}/${m.split('-')[0]}`}
                  </option>
                ))}
              </Select>
              {expenseMonth && (
                <span className="text-xs text-muted">
                  Total:{' '}
                  <span className="font-semibold text-danger">
                    {formatVND(monthTotal)}
                  </span>
                </span>
              )}
            </div>

            {showExpenseForm && (
              <form
                onSubmit={handleAddExpense}
                className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
              >
                <InputText
                  placeholder="Description"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  required
                />
                <InputText
                  type="number"
                  placeholder={`Amount (${VN_CURRENCY})`}
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  required
                  min="0"
                />
                <InputText
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors"
                >
                  Add Expense
                </button>
              </form>
            )}

            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted">
                {expenseMonth
                  ? `No expenses for ${expenseMonth.split('-')[1]}/${expenseMonth.split('-')[0]}.`
                  : 'No expenses yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-card-hover rounded-lg group transition-colors hover:bg-border/50"
                  >
                    {editingExpense === exp.id ? (
                      <div className="space-y-2">
                        <InputText
                          value={editExpenseForm.description}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              description: e.target.value,
                            })
                          }
                        />
                        <InputText
                          type="number"
                          value={editExpenseForm.amount}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              amount: e.target.value,
                            })
                          }
                          min="0"
                        />
                        <InputText
                          type="date"
                          value={editExpenseForm.date}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              date: e.target.value,
                            })
                          }
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditExpense(exp.id)}
                            className="text-xs text-accent hover:text-accent/80"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingExpense(null)}
                            className="text-xs text-muted hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="w-full md:flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {exp.description}
                            </span>
                            {exp.matchId && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                Match
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {new Date(exp.date).toLocaleDateString('en-US')}
                          </div>
                        </div>
                        <div className="w-full md:w-auto  flex justify-between md:justify-center items-center gap-2">
                          <span className="font-bold text-danger text-sm">
                            -{formatVND(exp.amount)}
                          </span>
                          {canManage && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEditExpense(exp)}
                                className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Match Expense Section */}
          {canManage && (
            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Match Expenses</h2>
                <button
                  onClick={() => setShowMatchExpenseForm(!showMatchExpenseForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showMatchExpenseForm ? '✕ Cancel' : '+ Add Match Expense'}
                </button>
              </div>

              {showMatchExpenseForm && (
                <form
                  onSubmit={handleAddMatchExpense}
                  className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  <Select
                    value={matchExpenseForm.matchId}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        matchId: e.target.value,
                      })
                    }
                    className="w-full text-sm"
                    required
                  >
                    <option value="">Select Match</option>
                    {availableMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        vs {m.opponent} —{' '}
                        {new Date(m.matchDate).toLocaleDateString('en-US')}
                      </option>
                    ))}
                  </Select>
                  <InputText
                    type="number"
                    placeholder={`Amount (${VN_CURRENCY})`}
                    value={matchExpenseForm.amount}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        amount: e.target.value,
                      })
                    }
                    required
                    min="0"
                  />
                  <InputText
                    type="date"
                    value={matchExpenseForm.date}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        date: e.target.value,
                      })
                    }
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    Add Match Expense
                  </button>
                </form>
              )}

              {/* List of all matches with expense status */}
              {matches.length === 0 ? (
                <p className="text-sm text-muted">No matches yet.</p>
              ) : (
                <div className="space-y-2">
                  {/* Matches without expense */}
                  {availableMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-card-hover rounded-lg flex items-center justify-between"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          vs {m.opponent}
                        </div>
                        <div className="text-xs text-muted">
                          {new Date(m.matchDate).toLocaleDateString('en-US')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Not entered
                      </span>
                    </div>
                  ))}

                  {/* Matches with expense (editable) */}
                  {expensedMatches.map((m) => {
                    const exp = getMatchExpense(m.id);
                    if (!exp) return null;
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-card-hover rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium truncate">
                              vs {m.opponent}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                              Entered
                            </span>
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(m.matchDate).toLocaleDateString('en-US')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-danger text-sm">
                            -{formatVND(exp.amount)}
                          </span>
                          <button
                            onClick={() => handleStartEditExpense(exp)}
                            className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
