'use client';

import { Star, StarHalf } from 'lucide-react';

export interface StarRatingProps {
  value: number;
  readOnly?: boolean;
  onChange?: (v: number) => void;
  size?: number;
}

type Tier = 'default' | 'silver' | 'gold' | 'diamond';

function tierOf(value: number): Tier {
  if (value >= 5) return 'diamond';
  if (value >= 4) return 'gold';
  if (value >= 3) return 'silver';
  return 'default';
}

const TIER_CLASSES: Record<Tier, string> = {
  default: 'text-slate-400 fill-slate-400/40',
  silver: 'text-slate-300 fill-slate-300',
  gold: 'text-yellow-400 fill-yellow-400',
  diamond:
    'text-cyan-300 fill-cyan-300 drop-shadow-[0_0_6px_rgba(165,243,252,0.9)]',
};

export function StarRating({
  value,
  readOnly,
  onChange,
  size = 18,
}: StarRatingProps) {
  const tier = tierOf(value);
  const tierClass = TIER_CLASSES[tier];

  const renderStar = (idx: number) => {
    // idx 0..4. Stars filled when value > idx.
    const diff = value - idx;
    if (diff >= 1) {
      return <Star size={size} className={tierClass} strokeWidth={1.5} />;
    }
    if (diff >= 0.5) {
      return <StarHalf size={size} className={tierClass} strokeWidth={1.5} />;
    }
    return (
      <Star
        size={size}
        className="text-slate-500 fill-transparent"
        strokeWidth={1.5}
      />
    );
  };

  return (
    <div className={`inline-flex items-center gap-0.5 ${tierClass}`}>
      {Array.from({ length: 5 }, (_, idx) => {
        const starNode = renderStar(idx);
        if (readOnly) {
          return (
            <span
              key={idx}
              data-testid={`star-slot-${idx + 1}`}
              className="inline-block"
            >
              {starNode}
            </span>
          );
        }
        return (
          <span
            key={idx}
            data-testid={`star-slot-${idx + 1}`}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            <span className="absolute inset-0">{starNode}</span>
            <button
              type="button"
              aria-label={`Rate ${idx + 0.5} stars`}
              data-testid={`star-slot-${idx + 1}-left`}
              onClick={() => onChange?.(idx + 0.5)}
              className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
            />
            <button
              type="button"
              aria-label={`Rate ${idx + 1} stars`}
              data-testid={`star-slot-${idx + 1}-right`}
              onClick={() => onChange?.(idx + 1)}
              className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
            />
          </span>
        );
      })}
    </div>
  );
}
