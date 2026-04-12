'use client';

import { PlayersPageSkeleton } from '@/components/shared/skeleton';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  positionsService,
  userPositionsService,
  usersService,
} from '@/services';
import type { Position, User, UserPosition } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

interface PlayerWithPositions extends User {
  positionNames: string[];
}

export default function PlayersPage() {
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [players, setPlayers] = useState<User[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [allUserPositions, setAllUserPositions] = useState<UserPosition[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = async () => {
    const [p, pos] = await Promise.all([
      usersService.getAll(),
      positionsService.getAll(),
    ]);
    const upResults = await Promise.all(
      p.map((u) => userPositionsService.getByUser(u.id)),
    );
    setPlayers(p);
    setPositions(pos);
    setAllUserPositions(upResults.flat());
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      const [p, pos] = await Promise.all([
        usersService.getAll(),
        positionsService.getAll(),
      ]);
      const upResults = await Promise.all(
        p.map((u) => userPositionsService.getByUser(u.id)),
      );
      setPlayers(p);
      setPositions(pos);
      setAllUserPositions(upResults.flat());
      setLoading(false);
    };
    load();
  }, []);

  // Build players with position names
  const playersWithPositions: PlayerWithPositions[] = useMemo(() => {
    return players.map((p) => {
      const userPos = allUserPositions.filter((up) => up.userId === p.id);
      const names = userPos
        .map((up) => positions.find((pos) => pos.id === up.positionId)?.name)
        .filter((n): n is string => Boolean(n));
      return { ...p, positionNames: names };
    });
  }, [players, allUserPositions, positions]);

  // Group players by PRIMARY position, sorted by jersey number within each group
  const groupedByPosition = useMemo(() => {
    const groups: Record<string, PlayerWithPositions[]> = {};

    for (const player of playersWithPositions) {
      const primaryUp = allUserPositions.find(
        (up) => up.userId === player.id && up.type === 'primary',
      );
      const groupName = primaryUp
        ? positions.find((p) => p.id === primaryUp.positionId)?.name ||
          'Unassigned'
        : 'Unassigned';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(player);
    }

    // Sort players within each group by jersey number
    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99),
      );
    }

    // Sort groups: position names alphabetically, "Unassigned" last
    const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return sortedEntries;
  }, [playersWithPositions, allUserPositions, positions]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Player',
      message:
        'Are you sure you want to delete this player? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await usersService.remove(id);
    setLoading(true);
    await reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Players</h1>
      </div>

      {loading ? (
        <PlayersPageSkeleton />
      ) : groupedByPosition.length === 0 ? (
        <p className="text-muted">No players yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedByPosition.map(([positionName, posPlayers]) => (
            <div key={positionName}>
              <h2 className="text-lg font-bold mb-3">{positionName}</h2>
              <div className="space-y-1">
                {posPlayers.map((p) => (
                  <Link
                    key={`${positionName}-${p.id}`}
                    href={`/players/${p.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                      {p.avatar ? (
                        <Image
                          src={p.avatar}
                          alt={p.displayName}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-bold text-sm">
                          {p.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {p.displayName}
                        </p>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            p.status === 1
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {p.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {p.jerseyNumber ?? '-'} &middot; {p.phone} &middot;{' '}
                        {p.email}
                      </p>
                    </div>
                    {canManage && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-danger text-xs hover:bg-danger/20 px-2 py-1 rounded transition-all"
                      >
                        Delete
                      </button>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
