import { POSITION_GROUPS } from '@/constant';
import type { Position } from '@/types';

export function getPositionGroupColorClass(pos?: Position | null): string {
  if (!pos) return POSITION_GROUPS.UNKNOWN.colorClass;
  const name = pos.name.toUpperCase();
  for (const group of Object.values(POSITION_GROUPS)) {
    if (group.roles.includes(name)) return group.colorClass;
  }
  return POSITION_GROUPS.UNKNOWN.colorClass;
}

export function getPositionGroupWeight(pos?: Position | null): number {
  if (!pos) return POSITION_GROUPS.UNKNOWN.weight;
  const name = pos.name.toUpperCase();
  for (const group of Object.values(POSITION_GROUPS)) {
    if (group.roles.includes(name)) return group.weight;
  }
  return POSITION_GROUPS.UNKNOWN.weight;
}

interface PositionBadgeProps {
  pos?: Position | null;
  testId?: string;
}

export function PositionBadge({ pos, testId }: PositionBadgeProps) {
  if (!pos) return null;
  const colorClass = getPositionGroupColorClass(pos);
  return (
    <span
      data-testid={testId}
      className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${colorClass}`}
    >
      {pos.name.toUpperCase()}
    </span>
  );
}
