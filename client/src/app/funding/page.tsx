'use client';

import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { VN_CURRENCY } from '@/constant';
import { CONTRIBUTION_TYPE } from '@/constant/enum';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  expenseSchema,
  matchExpenseSchema,
  type ExpenseForm,
  type MatchExpenseForm,
} from '@/schemas/funding.schema';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { ContributionChart } from './contribution-chart';
import { ExpenseChart } from './expense-chart';

function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export default function FundingPage() {
  const { t } = useTranslation();
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

  // Inline Match Expense
  const [inlineMatchExpenses, setInlineMatchExpenses] = useState<
    Record<string, string>
  >({});
  const [savingMatchExpense, setSavingMatchExpense] = useState<string | null>(
    null,
  );

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
  const expenseFormHook = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    mode: 'onTouched',
    defaultValues: {
      description: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
    },
  });

  // Expense month filter (YYYY-MM or '' for all)
  const [expenseMonth, setExpenseMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );

  // Match expense form
  const [showMatchExpenseForm, setShowMatchExpenseForm] = useState(false);
  const matchExpenseFormHook = useForm<MatchExpenseForm>({
    resolver: zodResolver(matchExpenseSchema),
    mode: 'onTouched',
    defaultValues: {
      matchId: '',
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
    },
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
      title: t('funding.deleteRound'),
      message: t('funding.deleteRoundConfirm'),
      confirmText: t('common.delete'),
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
      title: t('common.delete'),
      message: t('funding.deleteExpenseConfirm'),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await fundingService.removeContribution(id);
    loadData();
  };

  const handleAddExpense = async (data: ExpenseForm) => {
    await fundingService.addExpense({
      description: data.description,
      amount: data.amount,
      date: data.date,
    });
    expenseFormHook.reset();
    setShowExpenseForm(false);
    loadData();
  };

  const handleAddMatchExpense = async (data: MatchExpenseForm) => {
    const match = matches.find((m) => m.id === data.matchId);
    await fundingService.addExpense({
      description: `Match vs ${match?.opponent || 'N/A'}`,
      amount: data.amount,
      date: data.date,
      matchId: data.matchId,
    });
    matchExpenseFormHook.reset();
    setShowMatchExpenseForm(false);
    loadData();
  };

  const handleSaveInlineMatchExpense = async (
    matchId: string,
    opponent: string,
    matchDate: string,
  ) => {
    const amountStr = inlineMatchExpenses[matchId];
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return;

    setSavingMatchExpense(matchId);
    try {
      await fundingService.addExpense({
        description: `Match vs ${opponent || 'N/A'}`,
        amount,
        date: matchDate.slice(0, 10),
        matchId: matchId,
      });
      setInlineMatchExpenses((prev) => {
        const next = { ...prev };
        delete next[matchId];
        return next;
      });
      loadData();
    } finally {
      setSavingMatchExpense(null);
    }
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
      title: t('funding.deleteExpense'),
      message: t('funding.deleteExpenseConfirm'),
      confirmText: t('common.delete'),
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
        <h1 className="text-2xl font-bold mb-6">{t('funding.title')}</h1>
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
      <h1 className="text-2xl font-bold mb-6">{t('funding.title')}</h1>

      {/* ─── SUMMARY CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-8">
        {[
          {
            label: t('funding.totalIncome'),
            testId: 'summary-income',
            value: summary.totalIncome,
            color: 'text-accent',
          },
          {
            label: t('funding.totalExpense'),
            testId: 'summary-expense',
            value: summary.totalExpense,
            color: 'text-danger',
          },
          {
            label: t('funding.balance'),
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
              <h2 className="text-lg font-semibold">{t('funding.rounds')}</h2>
              {canManage && (
                <button
                  onClick={() => setShowRoundForm(!showRoundForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                  aria-label="Create Round"
                >
                  {showRoundForm
                    ? `- ${t('common.cancel')}`
                    : t('funding.newRound')}
                </button>
              )}
            </div>

            {showRoundForm && (
              <form onSubmit={handleCreateRound} className="flex gap-2 mb-3">
                <InputText
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder={t('funding.roundName')}
                  className="flex-1"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  {t('common.create')}
                </button>
              </form>
            )}

            {rounds.length === 0 ? (
              <p className="text-sm text-muted">{t('funding.noRounds')}</p>
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
                              {t('common.edit')}
                            </button>
                            <button
                              onClick={() => handleDeleteRound(r.id)}
                              className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                            >
                              {t('common.delete')}
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
                  {t('funding.contributions')} —{' '}
                  {rounds.find((r) => r.id === selectedRound)?.name}
                </h3>
                {canManage && (
                  <button
                    onClick={() => setShowContribForm(!showContribForm)}
                    className="text-sm text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                  >
                    {showContribForm
                      ? `- ${t('common.cancel')}`
                      : `+ ${t('funding.addContribution')}`}
                  </button>
                )}
              </div>

              {showContribForm && (
                <form
                  onSubmit={handleAddContributions}
                  className="space-y-3 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  <div className="flex items-center gap-4">
                    <InputText
                      type="date"
                      value={contribDate}
                      onChange={(e) => setContribDate(e.target.value)}
                      className="w-40"
                      required
                    />
                  </div>

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
                                {t('funding.cash')}
                              </option>
                              <option value={CONTRIBUTION_TYPE.DONATION}>
                                {t('funding.transfer')}
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
                    placeholder={t('funding.note')}
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
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors font-medium"
                  >
                    {t('common.save')} (
                    {
                      Object.values(contribAmounts).filter(
                        (v) => v && Number(v) > 0,
                      ).length
                    }{' '}
                    {t('common.players')})
                  </button>
                </form>
              )}

              {filteredContributions.length === 0 ? (
                <p className="text-sm text-muted">
                  {t('funding.noContributions')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted text-xs border-b border-border">
                        <th className="pb-2 pr-3">{t('common.players')}</th>
                        <th className="pb-2 pr-3">{t('funding.amount')}</th>
                        <th className="pb-2 pr-3">{t('funding.type')}</th>
                        <th className="pb-2 pr-3">{t('funding.date')}</th>
                        <th className="pb-2 pr-3">{t('funding.note')}</th>
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
                                ? t('funding.cash')
                                : t('funding.transfer')}
                            </span>
                          </td>
                          <td className="py-2 pr-3 text-muted">
                            {new Date(c.date).toLocaleDateString('vi-VN')}
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
                                {t('common.delete')}
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-semibold">
                        <td className="pt-2 pr-3">{t('funding.total')}</td>
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
              <h2 className="text-lg font-semibold">{t('funding.expenses')}</h2>
              {canManage && (
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showExpenseForm
                    ? `- ${t('common.cancel')}`
                    : t('funding.addExpense')}
                </button>
              )}
            </div>

            <ExpenseChart expenses={expenses} />

            {/* Month filter */}
            <div className="flex items-center justify-between gap-2 mb-3 ">
              <div className="w-auto">
                <Select
                  value={expenseMonth}
                  onChange={(e) => setExpenseMonth(e.target.value)}
                  className="text-sm"
                >
                  <option value="">{t('funding.all')}</option>
                  {expenseMonths.map((m) => (
                    <option key={m} value={m}>
                      {`${m.split('-')[1]}/${m.split('-')[0]}`}
                    </option>
                  ))}
                </Select>
              </div>
              {expenseMonth && (
                <span className="text-lg text-muted font-bold">
                  {t('funding.total')}:{' '}
                  <span className="font-semibold text-danger">
                    {formatVND(monthTotal)}
                  </span>
                </span>
              )}
            </div>

            {showExpenseForm && (
              <form
                onSubmit={expenseFormHook.handleSubmit(handleAddExpense)}
                className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
              >
                <InputText
                  placeholder={t('funding.description')}
                  error={expenseFormHook.formState.errors.description}
                  required
                  {...expenseFormHook.register('description')}
                />
                <InputText
                  type="number"
                  placeholder={`${t('funding.amount')} (${VN_CURRENCY})`}
                  error={expenseFormHook.formState.errors.amount}
                  required
                  min="0"
                  {...expenseFormHook.register('amount', {
                    valueAsNumber: true,
                  })}
                />
                <InputText
                  type="date"
                  required
                  {...expenseFormHook.register('date')}
                />
                <button
                  type="submit"
                  disabled={expenseFormHook.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
                >
                  {expenseFormHook.formState.isSubmitting
                    ? t('common.saving')
                    : t('funding.addExpense')}
                </button>
              </form>
            )}

            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted">
                {expenseMonth
                  ? `No expenses for ${expenseMonth.split('-')[1]}/${expenseMonth.split('-')[0]}.`
                  : t('funding.noExpenses')}
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
                            {t('common.save')}
                          </button>
                          <button
                            onClick={() => setEditingExpense(null)}
                            className="text-xs text-muted hover:text-foreground"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-between">
                        <div className="w-full md:flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
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
                            <span className="font-bold text-danger text-sm">
                              -{formatVND(exp.amount)}
                            </span>
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {new Date(exp.date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="w-full md:w-auto flex justify-end gap-2">
                          {canManage && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEditExpense(exp)}
                                className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                              >
                                {t('common.edit')}
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                              >
                                {t('common.delete')}
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
                <h2 className="text-lg font-semibold">
                  {t('funding.matchExpenses')}
                </h2>
                <button
                  onClick={() => setShowMatchExpenseForm(!showMatchExpenseForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showMatchExpenseForm
                    ? `- ${t('common.cancel')}`
                    : t('funding.addMatchExpense')}
                </button>
              </div>

              {showMatchExpenseForm && (
                <form
                  onSubmit={matchExpenseFormHook.handleSubmit(
                    handleAddMatchExpense,
                  )}
                  className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  <Controller
                    name="matchId"
                    control={matchExpenseFormHook.control}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="w-full text-sm"
                        required
                      >
                        <option value="">{t('funding.selectMatch')}</option>
                        {availableMatches.map((m) => (
                          <option key={m.id} value={m.id}>
                            vs {m.opponent} —{' '}
                            {new Date(m.matchDate).toLocaleDateString('vi-VN')}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  <InputText
                    type="number"
                    placeholder={`${t('funding.amount')} (${VN_CURRENCY})`}
                    error={matchExpenseFormHook.formState.errors.amount}
                    required
                    min="0"
                    {...matchExpenseFormHook.register('amount', {
                      valueAsNumber: true,
                    })}
                  />
                  <InputText
                    type="date"
                    required
                    {...matchExpenseFormHook.register('date')}
                  />
                  <button
                    type="submit"
                    disabled={matchExpenseFormHook.formState.isSubmitting}
                    className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    {matchExpenseFormHook.formState.isSubmitting
                      ? t('common.saving')
                      : t('funding.addMatchExpense')}
                  </button>
                </form>
              )}

              {/* List of all matches with expense status */}
              {matches.length === 0 ? (
                <p className="text-sm text-muted">{t('funding.noMatches')}</p>
              ) : (
                <div className="space-y-2">
                  {/* Matches without expense */}
                  {availableMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 bg-card-hover rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          vs {m.opponent}
                        </div>
                        <div className="text-xs text-muted mt-0.5">
                          {new Date(m.matchDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      {canManage ? (
                        <div className="flex items-center gap-2">
                          <InputText
                            type="number"
                            placeholder="0"
                            className="w-28 text-right h-8 text-sm"
                            min="0"
                            value={inlineMatchExpenses[m.id] || ''}
                            onChange={(e) =>
                              setInlineMatchExpenses((prev) => ({
                                ...prev,
                                [m.id]: e.target.value,
                              }))
                            }
                          />
                          <button
                            onClick={() =>
                              handleSaveInlineMatchExpense(
                                m.id,
                                m.opponent,
                                m.matchDate,
                              )
                            }
                            disabled={
                              !inlineMatchExpenses[m.id] ||
                              savingMatchExpense === m.id
                            }
                            className="text-xs font-medium bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded disabled:opacity-50 min-w-[60px] flex justify-center transition-colors"
                          >
                            {savingMatchExpense === m.id
                              ? '...'
                              : t('common.save')}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 self-start md:self-auto">
                          Not entered
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Matches with expense (editable) */}
                  {expensedMatches.map((m) => {
                    const exp = getMatchExpense(m.id);
                    if (!exp) return null;
                    return (
                      <div
                        key={m.id}
                        className="p-3 bg-card-hover rounded-lg transition-colors group hover:bg-border/50 flex flex-col md:flex-row md:items-center justify-between"
                      >
                        {editingExpense === exp.id ? (
                          <div className="space-y-2 w-full">
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
                                {t('common.save')}
                              </button>
                              <button
                                onClick={() => setEditingExpense(null)}
                                className="text-xs text-muted hover:text-foreground"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
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
                                {new Date(m.matchDate).toLocaleDateString(
                                  'vi-VN',
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-2 md:mt-0">
                              <span className="font-bold text-danger text-sm">
                                -{formatVND(exp.amount)}
                              </span>
                              <button
                                onClick={() => handleStartEditExpense(exp)}
                                className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                              >
                                {t('common.edit')}
                              </button>
                            </div>
                          </>
                        )}
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
