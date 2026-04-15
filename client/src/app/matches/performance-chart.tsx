import type { Match } from '@/types';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PerformanceChartProps {
  matches: Match[];
}

export function PerformanceChart({ matches }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    // Group matches by "YYYY-MM"
    const grouped = matches.reduce(
      (acc, m) => {
        // Only consider completed matches for performance
        if (m.status !== 'completed') return acc;

        const dateObj = new Date(m.matchDate);
        const monthKey = `${dateObj.getFullYear()}-${String(
          dateObj.getMonth() + 1,
        ).padStart(2, '0')}`;

        if (!acc[monthKey]) {
          acc[monthKey] = { name: monthKey, Win: 0, Draw: 0, Loss: 0 };
        }

        const hScore = m.homeScore || 0;
        const aScore = m.awayScore || 0;

        if (hScore > aScore) {
          acc[monthKey].Win += 1;
        } else if (hScore === aScore) {
          acc[monthKey].Draw += 1;
        } else {
          acc[monthKey].Loss += 1;
        }

        return acc;
      },
      {} as Record<
        string,
        { name: string; Win: number; Draw: number; Loss: number }
      >,
    );

    // Sort by chronological order
    const sortedKeys = Object.keys(grouped).sort();
    return sortedKeys.map((k) => grouped[k]);
  }, [matches]);

  if (chartData.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border flex items-center justify-center h-[300px]">
        <p className="text-muted">
          No finished matches data available for this range.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h3 className="text-lg font-semibold mb-6">W/D/L Performance Trend</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#333"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1a1b1e',
                borderColor: '#2c2e33',
                color: '#fff',
              }}
              itemStyle={{ color: '#fff' }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar
              dataKey="Win"
              stackId="a"
              fill="#10b981"
              radius={[0, 0, 4, 4]}
            />
            <Bar dataKey="Draw" stackId="a" fill="#f59e0b" />
            <Bar
              dataKey="Loss"
              stackId="a"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
