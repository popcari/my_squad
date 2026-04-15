import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePlayersByPositionGroup } from './use-players-by-position-group';
import type { Position, User, UserPosition } from '@/types';

const mkUser = (id: string, name: string, jersey?: number): User => ({
  id,
  email: `${id}@x.com`,
  displayName: name,
  role: 'player',
  phone: '0',
  jerseyNumber: jersey,
  status: 1,
  createdAt: '',
  updatedAt: '',
});

const positions: Position[] = [
  { id: 'p-gk', name: 'GK', createdAt: '', updatedAt: '' },
  { id: 'p-cb', name: 'CB', createdAt: '', updatedAt: '' },
  { id: 'p-cm', name: 'CM', createdAt: '', updatedAt: '' },
  { id: 'p-st', name: 'ST', createdAt: '', updatedAt: '' },
];

const up = (
  id: string,
  userId: string,
  positionId: string,
  type: 'primary' | 'sub' = 'primary',
): UserPosition => ({ id, userId, positionId, type, createdAt: '' });

describe('usePlayersByPositionGroup', () => {
  it('groups players GK → DEF → MID → FWD → OTHER and sorts by jersey within group', () => {
    const players = [
      mkUser('u-st', 'Zane', 9),
      mkUser('u-cb', 'Yoda', 4),
      mkUser('u-gk', 'Ana', 1),
      mkUser('u-cm', 'Bo', 8),
      mkUser('u-orphan', 'Xena'), // no primary position
    ];
    const userPositions = [
      up('1', 'u-gk', 'p-gk'),
      up('2', 'u-cb', 'p-cb'),
      up('3', 'u-cm', 'p-cm'),
      up('4', 'u-st', 'p-st'),
    ];

    const { result } = renderHook(() =>
      usePlayersByPositionGroup({ players, positions, userPositions }),
    );

    expect(result.current.flatSorted.map((p) => p.id)).toEqual([
      'u-gk',
      'u-cb',
      'u-cm',
      'u-st',
      'u-orphan',
    ]);
    expect(result.current.groups.map((g) => g.key)).toEqual([
      'GK',
      'DEF',
      'MID',
      'FWD',
      'OTHER',
    ]);
    expect(result.current.groupOf('u-gk')).toBe('GK');
    expect(result.current.groupOf('u-orphan')).toBe('OTHER');
    expect(result.current.primaryPositionOf('u-gk')?.name).toBe('GK');
    expect(result.current.primaryPositionOf('u-orphan')).toBeNull();
  });

  it('classifies long position names like "Goalkeeper", "Centre-Back" correctly', () => {
    const longPositions: Position[] = [
      { id: 'p1', name: 'Goalkeeper', createdAt: '', updatedAt: '' },
      { id: 'p2', name: 'Centre Back', createdAt: '', updatedAt: '' },
      { id: 'p3', name: 'Midfielder', createdAt: '', updatedAt: '' },
      { id: 'p4', name: 'Striker', createdAt: '', updatedAt: '' },
    ];
    const players = [
      mkUser('u1', 'A', 1),
      mkUser('u2', 'B', 2),
      mkUser('u3', 'C', 3),
      mkUser('u4', 'D', 4),
    ];
    const userPositions = [
      up('1', 'u1', 'p1'),
      up('2', 'u2', 'p2'),
      up('3', 'u3', 'p3'),
      up('4', 'u4', 'p4'),
    ];

    const { result } = renderHook(() =>
      usePlayersByPositionGroup({
        players,
        positions: longPositions,
        userPositions,
      }),
    );

    expect(result.current.groupOf('u1')).toBe('GK');
    expect(result.current.groupOf('u2')).toBe('DEF');
    expect(result.current.groupOf('u3')).toBe('MID');
    expect(result.current.groupOf('u4')).toBe('FWD');
  });

  it('ignores sub-position assignments (only primary classifies)', () => {
    const players = [mkUser('u1', 'A', 1)];
    const userPositions = [
      up('1', 'u1', 'p-st', 'sub'), // sub only — no primary → OTHER
    ];
    const { result } = renderHook(() =>
      usePlayersByPositionGroup({ players, positions, userPositions }),
    );
    expect(result.current.groupOf('u1')).toBe('OTHER');
  });
});
