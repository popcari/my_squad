'use client';

import type { Match } from '@/types';
import { useMemo } from 'react';

interface CalendarProps {
  year: number;
  month: number;
  matches: Match[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function Calendar({
  year,
  month,
  matches,
  selectedDate,
  onSelectDate,
  onPrev,
  onNext,
}: CalendarProps) {
  const { days, matchDates } = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: (number | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

    const mDates = new Set<number>();
    matches.forEach((m) => {
      const d = new Date(m.matchDate);
      if (d.getFullYear() === year && d.getMonth() === month) {
        mDates.add(d.getDate());
      }
    });

    return { days: cells, matchDates: mDates };
  }, [year, month, matches]);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const toDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <div className="bg-card rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          &lt;
        </button>
        <h2 className="font-semibold">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-card-hover text-muted hover:text-foreground transition-colors"
        >
          &gt;
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs text-muted py-1">
            {wd}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} />;

          const dateStr = toDateStr(day);
          const hasMatch = matchDates.has(day);
          const isSelected = selectedDate === dateStr;

          return (
            <button
              key={day}
              onClick={() => onSelectDate(dateStr)}
              className={`relative h-12 rounded-lg text-sm transition-colors flex items-center justify-center
                ${isSelected ? 'bg-primary text-white' : ''}
                ${!isSelected && isToday(day) ? 'bg-primary/20 text-primary font-bold' : ''}
                ${!isSelected && !isToday(day) ? 'hover:bg-card-hover text-foreground' : ''}
              `}
            >
              {day}
              {hasMatch && (
                <span
                  className={`absolute bottom-1 w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
