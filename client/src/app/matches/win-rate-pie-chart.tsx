'use client';

import { MATCH_STATUS } from '@/constant/enum';
import type { Match } from '@/types';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

export function WinRatePieChart({ matches }: { matches: Match[] }) {
  const completed = matches.filter((m) => m.status === MATCH_STATUS.COMPLETED);

  let win = 0,
    draw = 0,
    loss = 0;
  completed.forEach((m) => {
    if ((m.homeScore ?? 0) > (m.awayScore ?? 0)) win++;
    else if ((m.homeScore ?? 0) === (m.awayScore ?? 0)) draw++;
    else loss++;
  });

  const data = [
    { name: 'Win', value: win, color: '#10b981' },
    { name: 'Draw', value: draw, color: '#eab308' },
    { name: 'Loss', value: loss, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  if (completed.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 border border-border h-full flex flex-col">
        <h2 className="text-lg font-bold mb-4">Win Rate</h2>
        <div className="flex-1 flex items-center justify-center text-muted">
          No matches found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 border border-border h-full flex flex-col">
      <h2 className="text-lg font-bold mb-4">Win Rate</h2>
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-center gap-6 mt-4">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-sm font-medium">
              {d.name} ({Math.round((d.value / completed.length) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
