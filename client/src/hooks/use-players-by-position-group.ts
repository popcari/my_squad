import { POSITION_GROUPS } from '@/constant';
import type { Position, User, UserPosition } from '@/types';
import { useMemo } from 'react';

export type PositionGroupKey = 'GK' | 'DEF' | 'MID' | 'FWD' | 'OTHER';

export const POSITION_GROUP_ORDER: PositionGroupKey[] = [
  'GK',
  'DEF',
  'MID',
  'FWD',
  'OTHER',
];

const GROUP_LABEL_KEYS: Record<PositionGroupKey, string> = {
  GK: 'players.goalkeepers',
  DEF: 'players.defenders',
  MID: 'players.midfielders',
  FWD: 'players.forwards',
  OTHER: 'players.unassigned',
};

const GROUP_BORDER_CLASS: Record<PositionGroupKey, string> = {
  GK: 'border-yellow-500',
  DEF: 'border-blue-500',
  MID: 'border-green-500',
  FWD: 'border-red-500',
  OTHER: 'border-gray-500',
};

export interface PlayerGroup {
  key: PositionGroupKey;
  labelKey: string;
  borderClass: string;
  players: User[];
}

interface Args {
  players: User[];
  positions: Position[];
  userPositions: UserPosition[];
}

export interface PlayersByPositionGroupResult {
  /** Buckets in fixed display order (GK → DEF → MID → FWD → OTHER). */
  groups: PlayerGroup[];
  /** All players in the same order, jersey-sorted within each group. */
  flatSorted: User[];
  /** Group of a given user. */
  groupOf: (userId: string) => PositionGroupKey;
  /** Primary `Position` document of a user, or null. */
  primaryPositionOf: (userId: string) => Position | null;
}

function classifyByName(name: string | undefined): PositionGroupKey {
  if (!name) return 'OTHER';
  const n = name.toUpperCase();
  if (
    POSITION_GROUPS.GK.roles.includes(n) ||
    n.includes('KEEPER')
  )
    return 'GK';
  if (
    POSITION_GROUPS.DEFENDER.roles.includes(n) ||
    n.includes('DEFEND') ||
    n.includes('BACK')
  )
    return 'DEF';
  if (
    POSITION_GROUPS.MIDFIELDER.roles.includes(n) ||
    n.includes('MIDFIELD') ||
    n.includes('MIDDLE')
  )
    return 'MID';
  if (
    POSITION_GROUPS.ATTACKER.roles.includes(n) ||
    n.includes('FORWARD') ||
    n.includes('STRIKER') ||
    n.includes('WINGER') ||
    n.includes('ATTACK')
  )
    return 'FWD';
  return 'OTHER';
}

/**
 * Groups players by their primary position into the canonical football tiers
 * (GK → DEF → MID → FWD → OTHER). Within each tier players are sorted by
 * jersey number then display name.
 *
 * Returns both the grouped buckets (for grouped UI) and a flat sorted list
 * (for selects/dropdowns where headers don't make sense).
 */
export function usePlayersByPositionGroup({
  players,
  positions,
  userPositions,
}: Args): PlayersByPositionGroupResult {
  return useMemo(() => {
    const positionById = new Map(positions.map((p) => [p.id, p]));
    const primaryByUser = new Map<string, Position>();
    for (const up of userPositions) {
      if (up.type !== 'primary') continue;
      const pos = positionById.get(up.positionId);
      if (pos) primaryByUser.set(up.userId, pos);
    }

    const classify = (userId: string): PositionGroupKey =>
      classifyByName(primaryByUser.get(userId)?.name);

    const buckets: Record<PositionGroupKey, User[]> = {
      GK: [],
      DEF: [],
      MID: [],
      FWD: [],
      OTHER: [],
    };
    for (const p of players) buckets[classify(p.id)].push(p);

    const cmp = (a: User, b: User) =>
      (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999) ||
      a.displayName.localeCompare(b.displayName);
    for (const k of POSITION_GROUP_ORDER) buckets[k].sort(cmp);

    const groups: PlayerGroup[] = POSITION_GROUP_ORDER.map((key) => ({
      key,
      labelKey: GROUP_LABEL_KEYS[key],
      borderClass: GROUP_BORDER_CLASS[key],
      players: buckets[key],
    }));

    return {
      groups,
      flatSorted: POSITION_GROUP_ORDER.flatMap((k) => buckets[k]),
      groupOf: classify,
      primaryPositionOf: (id) => primaryByUser.get(id) ?? null,
    };
  }, [players, positions, userPositions]);
}
