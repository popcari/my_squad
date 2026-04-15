import type { MatchGoal, User } from '@/types';
import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface PlayerStatsChartProps {
  goals: MatchGoal[];
  players: User[];
}

interface TooltipPayload {
  value: number;
  payload: { name: string };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card text-card-foreground p-2 border border-border rounded text-sm shadow-lg">
        <p className="font-semibold">{payload[0].payload.name}</p>
        <p className="text-primary">{`${payload[0].value} Count`}</p>
      </div>
    );
  }
  return null;
}

export function PlayerStatsChart({ goals, players }: PlayerStatsChartProps) {
  const { topScorers, topAssists } = useMemo(() => {
    const scorersMap: Record<string, number> = {};
    const assistsMap: Record<string, number> = {};

    goals.forEach((g) => {
      if (g.scorerId) {
        scorersMap[g.scorerId] = (scorersMap[g.scorerId] || 0) + 1;
      }
      if (g.assistId) {
        // Assume assistId exists and is valid
        assistsMap[g.assistId] = (assistsMap[g.assistId] || 0) + 1;
      }
    });

    const getDisplayName = (id: string) =>
      players.find((p) => p.id === id)?.displayName || 'Unknown';

    const topScorersArray = Object.entries(scorersMap)
      .map(([id, count]) => ({ name: getDisplayName(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    const topAssistsArray = Object.entries(assistsMap)
      .map(([id, count]) => ({ name: getDisplayName(id), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return { topScorers: topScorersArray, topAssists: topAssistsArray };
  }, [goals, players]);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-6">Top Scorers</h3>
        {topScorers.length === 0 ? (
          <p className="text-muted text-sm">No goals recorded yet.</p>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topScorers}
                margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#888"
                  fontSize={12}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  fontSize={12}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold mb-6">Top Assisters</h3>
        {topAssists.length === 0 ? (
          <p className="text-muted text-sm">No assists recorded yet.</p>
        ) : (
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={topAssists}
                margin={{ top: 0, right: 20, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#333"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke="#888"
                  fontSize={12}
                  allowDecimals={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#888"
                  fontSize={12}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="count"
                  fill="#8b5cf6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
