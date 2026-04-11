'use client';

import { Select } from '@/components/ui/select';
import type { Contribution, FundingRound, User } from '@/types';
import { useMemo, useState } from 'react';
import type { PieLabelRenderProps } from 'recharts';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = [
  '#6366f1', // indigo
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#3b82f6', // blue
  '#84cc16', // lime
  '#06b6d4', // cyan
  '#e11d48', // rose
];

function formatVND(amount: number): string {
  return amount.toLocaleString('en-US') + 'đ';
}

interface ContributionChartProps {
  contributions: Contribution[];
  rounds: FundingRound[];
  players: User[];
}

interface PlayerShare {
  name: string;
  amount: number;
  percentage: number;
}

export function ContributionChart({
  contributions,
  rounds,
  players,
}: ContributionChartProps) {
  const [selectedRoundId, setSelectedRoundId] = useState<string>('');

  // Filter contributions by round
  const filtered = useMemo(
    () =>
      selectedRoundId
        ? contributions.filter((c) => c.roundId === selectedRoundId)
        : contributions,
    [contributions, selectedRoundId],
  );

  // Aggregate by player
  const { chartData, ranking, total } = useMemo(() => {
    const byPlayer = new Map<string, number>();
    for (const c of filtered) {
      byPlayer.set(c.userId, (byPlayer.get(c.userId) || 0) + c.amount);
    }

    const total = filtered.reduce((sum, c) => sum + c.amount, 0);

    const ranking: PlayerShare[] = [...byPlayer.entries()]
      .map(([userId, amount]) => ({
        name: players.find((p) => p.id === userId)?.displayName || userId,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const chartData = ranking.map((r) => ({
      name: r.name,
      value: r.amount,
    }));

    return { chartData, ranking, total };
  }, [filtered, players]);

  if (contributions.length === 0) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-4 border border-border mb-6">
      <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-2">
        <h2 className="text-lg font-semibold">Contribution Statistics</h2>
        <div className="w-full md:w-[30%] ">
          <Select
            value={selectedRoundId}
            onChange={(e) => setSelectedRoundId(e.target.value)}
            className="text-sm"
          >
            <option value="">All Rounds</option>
            {rounds.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted text-center py-8">
          No contribution data for this round.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <div className="flex flex-col items-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={(props: PieLabelRenderProps) =>
                    `${props.name ?? ''} (${(((props.percent as number) ?? 0) * 100).toFixed(0)}%)`
                  }
                  labelLine={false}
                >
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatVND(Number(value))}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted mt-2">
              Total:{' '}
              <span className="font-semibold text-accent">
                {formatVND(total)}
              </span>
            </p>
          </div>

          {/* Ranking */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-muted uppercase tracking-wider">
              Contribution Ranking
            </h3>
            <div className="space-y-2">
              {ranking.map((player, idx) => (
                <div key={player.name} className="flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      idx === 0
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : idx === 1
                          ? 'bg-gray-400/20 text-gray-400'
                          : idx === 2
                            ? 'bg-amber-700/20 text-amber-600'
                            : 'bg-border text-muted'
                    }`}
                  >
                    {idx + 1}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {player.name}
                      </span>
                      <span className="text-sm font-bold text-accent ml-2 shrink-0">
                        {formatVND(player.amount)}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-border rounded-full h-1.5 mt-1">
                      <div
                        className="h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${player.percentage}%`,
                          backgroundColor: COLORS[idx % COLORS.length],
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">
                      {player.percentage.toFixed(1)}% of total fund
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
