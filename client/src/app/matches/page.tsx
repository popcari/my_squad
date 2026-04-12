'use client';

import { CloseButton } from '@/components/ui/close-button';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { MATCH_STATUS } from '@/constant/enum';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  createMatchSchema,
  type CreateMatchForm,
} from '@/schemas/create-match.schema';
import { fundingService, matchesService, usersService } from '@/services';
import type { Expense, Match, MatchGoal, User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { MatchDetailsDrawer } from './match-details-drawer';
import { PerformanceChart } from './performance-chart';
import { PlayerStatsChart } from './player-stats-chart';
import { WinRatePieChart } from './win-rate-pie-chart';

export default function MatchesPage() {
  const canManage = useCanManage();

  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [players, setPlayers] = useState<User[]>([]);

  // Selected state for details drawer
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  // Filters
  const currentMonthStr = `${new Date().getFullYear()}-${String(
    new Date().getMonth() + 1,
  ).padStart(2, '0')}`;
  const [monthStart, setMonthStart] = useState(currentMonthStr);
  const [monthEnd, setMonthEnd] = useState(currentMonthStr);

  const loadData = async () => {
    setLoading(true);
    try {
      const [m, g, e, p] = await Promise.all([
        matchesService.getAll(),
        matchesService.getAllGoals(),
        fundingService.getExpenses(),
        usersService.getAll(),
      ]);
      // Sort matches descending by date
      m.sort(
        (a, b) =>
          new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime(),
      );
      setMatches(m);
      setGoals(g);
      setExpenses(e);
      setPlayers(p);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleMatchUpdate = () => {
    loadData();
    // Maintain opened match context by finding updated
    if (selectedMatch) {
      matchesService
        .getOne(selectedMatch.id)
        .then((updated) => setSelectedMatch(updated));
    }
  };

  // Create match state and form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T15:00`;

  const createForm = useForm<CreateMatchForm>({
    resolver: zodResolver(createMatchSchema),
    mode: 'onTouched',
    defaultValues: {
      opponent: '',
      matchDate: todayStr,
      location: '',
      notes: '',
    },
  });

  const handleCreateMatch = async (data: CreateMatchForm) => {
    await matchesService.create({
      ...data,
      matchDate: new Date(data.matchDate).toISOString(),
    });
    createForm.reset({
      opponent: '',
      matchDate: todayStr,
      location: '',
      notes: '',
    });
    setShowCreateModal(false);
    loadData();
  };

  // Filter Data
  const filteredMatches = matches.filter((m) => {
    const matchMonth = m.matchDate.substring(0, 7); // YYYY-MM
    if (monthStart && matchMonth < monthStart) return false;
    if (monthEnd && matchMonth > monthEnd) return false;
    return true;
  });
  const filteredMatchIds = new Set(filteredMatches.map((m) => m.id));
  const filteredGoals = goals.filter((g) => filteredMatchIds.has(g.matchId));

  // Determine available month filters from data
  const availableMonths = [
    ...new Set(
      matches.map((m) => {
        const d = new Date(m.matchDate);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }),
    ),
  ].sort((a, b) => b.localeCompare(a)); // Descending

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Matches Dashboard</h1>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex items-center w-full">
            <div className="w-[45%] md:w-[160px] ">
              <Select
                aria-label="From Month"
                value={monthStart}
                onChange={(e) => setMonthStart(e.target.value)}
              >
                <option value="">All Time (Start)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <span className="text-muted text-sm w-[10%] text-center font-bold">
              -
            </span>
            <div className="w-[45%] md:w-[160px] ">
              <Select
                aria-label="To Month"
                value={monthEnd}
                onChange={(e) => setMonthEnd(e.target.value)}
              >
                <option value="">All Time (End)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary w-full hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              + New Match
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-[350px] bg-card rounded-lg" />
          <div className="h-[350px] bg-card rounded-lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                {/* The Performance chart shows filtered matches trend */}
                <PerformanceChart matches={filteredMatches} />
              </div>
              <div className="md:col-span-1">
                <WinRatePieChart matches={filteredMatches} />
              </div>
            </section>

            <section>
              {/* Player stats based on the currently filtered goals */}
              <PlayerStatsChart goals={filteredGoals} players={players} />
            </section>
          </div>

          <div className="lg:col-span-1">
            <section>
              <h2 className="text-xl font-bold mb-4">
                Match List
                {(monthStart || monthEnd) &&
                  ` (${monthStart || 'Start'} to ${monthEnd || 'End'})`}
              </h2>
              <div className="bg-card rounded-lg border border-border overflow-hidden flex flex-col max-h-[700px]">
                <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                  <table className="w-full text-sm text-left relative">
                    <thead className="bg-card-hover text-muted sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Opponent</th>
                        <th className="px-4 py-3 font-medium text-center">
                          Score
                        </th>
                        <th className="px-4 py-3 font-medium text-center">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMatches.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-4 py-8 text-center text-muted"
                          >
                            No matches found.
                          </td>
                        </tr>
                      ) : (
                        filteredMatches.map((match) => {
                          return (
                            <tr
                              key={match.id}
                              onClick={() => setSelectedMatch(match)}
                              className="border-b border-border hover:bg-card-hover/50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                {new Date(match.matchDate).toLocaleDateString(
                                  'en-US',
                                )}
                              </td>
                              <td className="px-4 py-3 font-medium text-primary">
                                {match.opponent}
                              </td>
                              <td className="px-4 py-3 text-center whitespace-nowrap">
                                <div
                                  className={`inline-block px-3 py-1 rounded-md font-bold ${
                                    match.status === MATCH_STATUS.COMPLETED
                                      ? match.homeScore! > match.awayScore!
                                        ? 'bg-accent/20 text-accent'
                                        : match.homeScore! < match.awayScore!
                                          ? 'bg-danger/20 text-danger'
                                          : 'bg-yellow-500/20 text-yellow-500'
                                      : 'text-muted'
                                  }`}
                                >
                                  {match.status === MATCH_STATUS.COMPLETED
                                    ? `${match.homeScore ?? 0} - ${match.awayScore ?? 0}`
                                    : '-'}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div
                                  className={`w-7 h-7 mx-auto inline-flex items-center justify-center rounded-full ${
                                    match.status === MATCH_STATUS.COMPLETED
                                      ? 'bg-emerald-500/20 text-emerald-500'
                                      : match.status === MATCH_STATUS.CANCELLED
                                        ? 'bg-red-500/20 text-red-500'
                                        : 'bg-yellow-500/20 text-yellow-500'
                                  }`}
                                  title={match.status.replace('_', ' ')}
                                >
                                  {match.status === MATCH_STATUS.COMPLETED ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                  ) : match.status === MATCH_STATUS.CANCELLED ? (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Match Details Drawer Context */}
      <MatchDetailsDrawer
        match={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        onUpdated={handleMatchUpdate}
        players={players}
      />

      {/* Create Match Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-50 w-[90%] max-w-md bg-card border border-border shadow-2xl rounded-xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-bold">Create New Match</h2>
              <CloseButton onClick={() => setShowCreateModal(false)} />
            </div>
            <div className="p-6">
              <form
                onSubmit={createForm.handleSubmit(handleCreateMatch)}
                className="space-y-4"
              >
                <InputText
                  label="Opponent"
                  placeholder="Opponent"
                  error={createForm.formState.errors.opponent}
                  required
                  {...createForm.register('opponent')}
                />
                <InputText
                  label="Match Date & Time"
                  type="datetime-local"
                  error={createForm.formState.errors.matchDate}
                  required
                  {...createForm.register('matchDate')}
                />
                <InputText
                  label="Location"
                  placeholder="Location"
                  error={createForm.formState.errors.location}
                  required
                  {...createForm.register('location')}
                />
                <InputText
                  label="Notes"
                  placeholder="Notes (optional)"
                  {...createForm.register('notes')}
                />
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-card-hover transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createForm.formState.isSubmitting}
                    className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {createForm.formState.isSubmitting
                      ? 'Creating...'
                      : 'Create Match'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
