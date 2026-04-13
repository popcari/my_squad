'use client';

import { Select } from '@/components/ui/select';
import type { Expense } from '@/types';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

export function ExpenseChart({ expenses }: { expenses: Expense[] }) {
  const { t } = useTranslation();
  const [range, setRange] = useState<number>(6);

  const data = useMemo(() => {
    const result = [];
    const now = new Date();
    // Normalize to the first day of the current month
    now.setDate(1);

    for (let i = range - 1; i >= 0; i--) {
      // Calculate the month iteratively backwards
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

      const monthExpenses = expenses.filter((e) =>
        e.date.startsWith(monthPrefix),
      );
      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      result.push({
        name: `${d.getMonth() + 1}/${d.getFullYear()}`,
        total,
      });
    }

    return result;
  }, [expenses, range]);

  if (expenses.length === 0) return null;

  return (
    <div className="bg-card rounded-lg p-4 border border-border flex flex-col mb-4 transition-colors">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold">{t('funding.expensesTrend')}</h3>
        <div className="w-auto">
          <Select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="text-xs h-8 w-auto min-w-[120px]"
          >
            <option value={6}>6 {t('common.month')}</option>
            <option value={12}>1 {t('common.year')}</option>
            <option value={24}>2 {t('common.year')}</option>
          </Select>
        </div>
      </div>

      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#ef4444', fontSize: 12, fontWeight: 'bold' }}
              dy={10}
              niceTicks="adaptive"
            />
            <YAxis hide />
            <Tooltip
              cursor={{
                stroke: 'hsl(var(--border))',
                strokeWidth: 1,
              }}
              contentStyle={{
                backgroundColor: '#ebebeb',
                borderColor: '#acacac',
                borderRadius: '0.5rem',
                fontSize: '12px',
              }}
              formatter={(value) => [
                formatVND(Number(value) || 0),
                t('funding.total'),
              ]}
              labelStyle={{
                color: 'hsl(var(--foreground))',
                marginBottom: '4px',
              }}
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#ef4444"
              fillOpacity={1}
              fill="url(#colorTotal)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
