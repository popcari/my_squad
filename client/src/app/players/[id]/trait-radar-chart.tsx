'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface TraitRadarDatum {
  id: string;
  name: string;
  rating: number;
}

interface TraitRadarChartProps {
  data: TraitRadarDatum[];
}

const MIN_AXES = 3;

export function TraitRadarChart({ data }: TraitRadarChartProps) {
  if (data.length < MIN_AXES) return null;

  const chartData = data.map((d) => ({ name: d.name, rating: d.rating }));

  return (
    <div className="w-full h-64 md:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} outerRadius="75%">
          <PolarGrid stroke="rgba(148,163,184,0.25)" />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: 'var(--foreground)', fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={[0, 5]}
            tickCount={6}
            tick={{ fill: 'var(--muted)', fontSize: 10 }}
            axisLine={false}
          />
          <Radar
            name="Rating"
            dataKey="rating"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value} / 5`, 'Rating']}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
