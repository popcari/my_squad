'use client';

import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import { fundingService } from '@/services/funding.service';
import { matchesService, usersService } from '@/services';
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

  // Contribution form
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribForm, setContribForm] = useState({
    userId: '',
    amount: '',
    type: 'recurring' as 'recurring' | 'donation',
    note: '',
    date: new Date().toISOString().slice(0, 10),
  });

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
  const expenseMonths = [...new Set(expenses.map((e) => e.date.slice(0, 7)))].sort().reverse();

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
      title: 'Xóa đợt đóng góp',
      message:
        'Xóa đợt này sẽ xóa toàn bộ khoản đóng góp liên quan. Bạn có chắc?',
      confirmText: 'Xóa',
      danger: true,
    });
    if (!ok) return;
    await fundingService.removeRound(id);
    if (selectedRound === id) setSelectedRound(null);
    loadData();
  };

  const handleAddContribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRound || !contribForm.userId || !contribForm.amount) return;
    await fundingService.addContribution({
      roundId: selectedRound,
      userId: contribForm.userId,
      amount: Number(contribForm.amount),
      type: contribForm.type,
      note: contribForm.note || undefined,
      date: contribForm.date,
    });
    setContribForm({
      userId: '',
      amount: '',
      type: 'recurring',
      note: '',
      date: new Date().toISOString().slice(0, 10),
    });
    setShowContribForm(false);
    loadData();
  };

  const handleDeleteContribution = async (id: string) => {
    const ok = await confirm({
      title: 'Xóa khoản đóng góp',
      message: 'Bạn có chắc muốn xóa khoản đóng góp này?',
      confirmText: 'Xóa',
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
      description: `Trận đấu vs ${match?.opponent || 'N/A'}`,
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
      title: 'Xóa khoản chi',
      message: 'Bạn có chắc muốn xóa khoản chi này?',
      confirmText: 'Xóa',
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
        <h1 className="text-2xl font-bold mb-6">Quỹ đội</h1>
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
      <h1 className="text-2xl font-bold mb-6">Quỹ đội</h1>

      {/* ─── SUMMARY CARDS ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-lg p-5 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Tổng thu
          </p>
          <p
            data-testid="summary-income"
            className="text-2xl font-bold text-accent"
          >
            {formatVND(summary.totalIncome)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-5 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Tổng chi
          </p>
          <p
            data-testid="summary-expense"
            className="text-2xl font-bold text-danger"
          >
            {formatVND(summary.totalExpense)}
          </p>
        </div>
        <div className="bg-card rounded-lg p-5 border border-border">
          <p className="text-xs text-muted uppercase tracking-wider mb-1">
            Số dư
          </p>
          <p
            data-testid="summary-balance"
            className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary' : 'text-danger'}`}
          >
            {formatVND(summary.balance)}
          </p>
        </div>
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
              <h2 className="text-lg font-semibold">Đợt đóng góp</h2>
              {canManage && (
                <button
                  onClick={() => setShowRoundForm(!showRoundForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                  aria-label="Tạo đợt"
                >
                  {showRoundForm ? '✕ Hủy' : '+ Tạo đợt'}
                </button>
              )}
            </div>

            {showRoundForm && (
              <form
                onSubmit={handleCreateRound}
                className="flex gap-2 mb-3"
              >
                <input
                  value={roundName}
                  onChange={(e) => setRoundName(e.target.value)}
                  placeholder="Tên đợt (VD: Đợt 1 - Tháng 4)"
                  className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Tạo
                </button>
              </form>
            )}

            {rounds.length === 0 ? (
              <p className="text-sm text-muted">
                Chưa có đợt đóng góp nào.
              </p>
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
                        <input
                          value={editRoundName}
                          onChange={(e) => setEditRoundName(e.target.value)}
                          className="flex-1 bg-background border border-border rounded px-2 py-1 text-sm"
                        />
                        <button
                          onClick={() => handleUpdateRound(r.id)}
                          className="text-xs text-accent hover:text-accent/80"
                        >
                          Lưu
                        </button>
                        <button
                          onClick={() => setEditingRound(null)}
                          className="text-xs text-muted hover:text-foreground"
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-sm">
                            {r.name}
                          </span>
                          <span className="text-xs text-muted ml-2">
                            {contributions.filter((c) => c.roundId === r.id)
                              .length}{' '}
                            khoản
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
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteRound(r.id)}
                              className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                            >
                              Xóa
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
                  Đóng góp —{' '}
                  {rounds.find((r) => r.id === selectedRound)?.name}
                </h3>
                {canManage && (
                  <button
                    onClick={() => setShowContribForm(!showContribForm)}
                    className="text-sm text-primary hover:text-primary-hover transition-colors"
                  >
                    {showContribForm ? '✕ Hủy' : '+ Thêm'}
                  </button>
                )}
              </div>

              {showContribForm && (
                <form
                  onSubmit={handleAddContribution}
                  className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  <select
                    value={contribForm.userId}
                    onChange={(e) =>
                      setContribForm({ ...contribForm, userId: e.target.value })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Chọn thành viên</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Số tiền (VND)"
                    value={contribForm.amount}
                    onChange={(e) =>
                      setContribForm({ ...contribForm, amount: e.target.value })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                    min="0"
                  />
                  <div className="flex gap-2">
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="contribType"
                        value="recurring"
                        checked={contribForm.type === 'recurring'}
                        onChange={() =>
                          setContribForm({ ...contribForm, type: 'recurring' })
                        }
                        className="accent-primary"
                      />
                      Định kỳ
                    </label>
                    <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="contribType"
                        value="donation"
                        checked={contribForm.type === 'donation'}
                        onChange={() =>
                          setContribForm({ ...contribForm, type: 'donation' })
                        }
                        className="accent-primary"
                      />
                      Quyên góp
                    </label>
                  </div>
                  <input
                    type="date"
                    value={contribForm.date}
                    onChange={(e) =>
                      setContribForm({ ...contribForm, date: e.target.value })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <input
                    placeholder="Ghi chú (tùy chọn)"
                    value={contribForm.note}
                    onChange={(e) =>
                      setContribForm({ ...contribForm, note: e.target.value })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    Thêm đóng góp
                  </button>
                </form>
              )}

              {filteredContributions.length === 0 ? (
                <p className="text-sm text-muted">
                  Chưa có khoản đóng góp nào trong đợt này.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-muted text-xs border-b border-border">
                        <th className="pb-2 pr-3">Thành viên</th>
                        <th className="pb-2 pr-3">Số tiền</th>
                        <th className="pb-2 pr-3">Loại</th>
                        <th className="pb-2 pr-3">Ngày</th>
                        <th className="pb-2 pr-3">Ghi chú</th>
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
                                c.type === 'recurring'
                                  ? 'bg-primary/20 text-primary'
                                  : 'bg-accent/20 text-accent'
                              }`}
                            >
                              {c.type === 'recurring'
                                ? 'Định kỳ'
                                : 'Quyên góp'}
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
                                Xóa
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-border font-semibold">
                        <td className="pt-2 pr-3">Tổng</td>
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
              <h2 className="text-lg font-semibold">Khoản chi</h2>
              {canManage && (
                <button
                  onClick={() => setShowExpenseForm(!showExpenseForm)}
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showExpenseForm ? '✕ Hủy' : '+ Thêm khoản chi'}
                </button>
              )}
            </div>

            {/* Month filter */}
            <div className="flex items-center gap-2 mb-3">
              <select
                value={expenseMonth}
                onChange={(e) => setExpenseMonth(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="">Tất cả</option>
                {expenseMonths.map((m) => (
                  <option key={m} value={m}>
                    Tháng {m.split('-')[1]}/{m.split('-')[0]}
                  </option>
                ))}
              </select>
              {expenseMonth && (
                <span className="text-xs text-muted">
                  Tổng: <span className="font-semibold text-danger">{formatVND(monthTotal)}</span>
                </span>
              )}
            </div>

            {showExpenseForm && (
              <form
                onSubmit={handleAddExpense}
                className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
              >
                <input
                  placeholder="Mô tả"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({
                      ...expenseForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
                <input
                  type="number"
                  placeholder="Số tiền (VND)"
                  value={expenseForm.amount}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                  }
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  required
                  min="0"
                />
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, date: e.target.value })
                  }
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors"
                >
                  Thêm khoản chi
                </button>
              </form>
            )}

            {filteredExpenses.length === 0 ? (
              <p className="text-sm text-muted">
                {expenseMonth
                  ? `Không có khoản chi nào trong tháng ${expenseMonth.split('-')[1]}/${expenseMonth.split('-')[0]}.`
                  : 'Chưa có khoản chi nào.'}
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
                        <input
                          value={editExpenseForm.description}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                        />
                        <input
                          type="number"
                          value={editExpenseForm.amount}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              amount: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                          min="0"
                        />
                        <input
                          type="date"
                          value={editExpenseForm.date}
                          onChange={(e) =>
                            setEditExpenseForm({
                              ...editExpenseForm,
                              date: e.target.value,
                            })
                          }
                          className="w-full bg-background border border-border rounded px-2 py-1 text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEditExpense(exp.id)}
                            className="text-xs text-accent hover:text-accent/80"
                          >
                            Lưu
                          </button>
                          <button
                            onClick={() => setEditingExpense(null)}
                            className="text-xs text-muted hover:text-foreground"
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">
                              {exp.description}
                            </span>
                            {exp.matchId && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                                Trận đấu
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {new Date(exp.date).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-danger text-sm">
                            -{formatVND(exp.amount)}
                          </span>
                          {canManage && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStartEditExpense(exp)}
                                className="px-2 py-1 text-xs text-primary hover:bg-primary/20 rounded"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id)}
                                className="px-2 py-1 text-xs text-danger hover:bg-danger/20 rounded"
                              >
                                Xóa
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
                  Chi phí trận đấu
                </h2>
                <button
                  onClick={() =>
                    setShowMatchExpenseForm(!showMatchExpenseForm)
                  }
                  className="text-sm text-primary hover:text-primary-hover transition-colors"
                >
                  {showMatchExpenseForm ? '✕ Hủy' : '+ Nhập chi phí'}
                </button>
              </div>

              {showMatchExpenseForm && (
                <form
                  onSubmit={handleAddMatchExpense}
                  className="space-y-2 mb-4 p-3 bg-background rounded-lg border border-border"
                >
                  <select
                    value={matchExpenseForm.matchId}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        matchId: e.target.value,
                      })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Chọn trận đấu</option>
                    {availableMatches.map((m) => (
                      <option key={m.id} value={m.id}>
                        vs {m.opponent} —{' '}
                        {new Date(m.matchDate).toLocaleDateString('vi-VN')}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Số tiền (VND)"
                    value={matchExpenseForm.amount}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        amount: e.target.value,
                      })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                    min="0"
                  />
                  <input
                    type="date"
                    value={matchExpenseForm.date}
                    onChange={(e) =>
                      setMatchExpenseForm({
                        ...matchExpenseForm,
                        date: e.target.value,
                      })
                    }
                    className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors"
                  >
                    Thêm chi phí trận đấu
                  </button>
                </form>
              )}

              {/* List of all matches with expense status */}
              {matches.length === 0 ? (
                <p className="text-sm text-muted">Chưa có trận đấu nào.</p>
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
                          {new Date(m.matchDate).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                        Chưa nhập
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
                              Đã nhập
                            </span>
                          </div>
                          <div className="text-xs text-muted">
                            {new Date(m.matchDate).toLocaleDateString('vi-VN')}
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
                            Sửa
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
