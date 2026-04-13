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
import { useTranslation } from 'react-i18next';

interface PlayerWithPositions extends User {
  positionNames: string[];
}

export default function PlayersPage() {
  const { t } = useTranslation();
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

  // Group players by MACRO position, sorted by jersey number
  const groupedByPosition = useMemo(() => {
    const groups: Record<string, PlayerWithPositions[]> = {};

    const getMacroGroup = (posName: string) => {
      const n = (posName || '').toUpperCase();
      if (['GK', 'GOALKEEPER'].includes(n)) return '1_Goalkeepers';
      if (['CB', 'LB', 'RB', 'LWB', 'RWB', 'SW', 'DEFENDER'].includes(n))
        return '2_Defenders';
      if (['CDM', 'CM', 'CAM', 'LM', 'RM', 'MIDFIELDER'].includes(n))
        return '3_Midfielders';
      if (['ST', 'CF', 'LW', 'RW', 'SS', 'FORWARD', 'ATTACKER'].includes(n))
        return '4_Forwards';
      return '5_Unassigned';
    };

    for (const player of playersWithPositions) {
      const primaryUp = allUserPositions.find(
        (up) => up.userId === player.id && up.type === 'primary',
      );
      const posName = primaryUp
        ? positions.find((p) => p.id === primaryUp.positionId)?.name ||
          'Unassigned'
        : 'Unassigned';

      const groupName = getMacroGroup(posName);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(player);
    }

    // Sort players within each group by jersey number
    for (const key of Object.keys(groups)) {
      groups[key].sort(
        (a, b) => (a.jerseyNumber ?? 99) - (b.jerseyNumber ?? 99),
      );
    }

    // Sort groups by the order prefix, then strip the prefix for display
    const sortedEntries = Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, groupPlayers]) => {
        const name = key.substring(2);
        let label = name;
        if (name === 'Goalkeepers') label = t('players.goalkeepers');
        if (name === 'Defenders') label = t('players.defenders');
        if (name === 'Midfielders') label = t('players.midfielders');
        if (name === 'Forwards') label = t('players.forwards');
        if (name === 'Unassigned') label = t('players.unassigned');

        return [label, groupPlayers] as [string, PlayerWithPositions[]];
      });

    return sortedEntries;
  }, [playersWithPositions, allUserPositions, positions, t]);

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: t('common.delete'),
      message: t('common.deleteConfirm'),
      confirmText: t('common.delete'),
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
        <h1 className="text-2xl font-bold">{t('players.title')}</h1>
      </div>

      {loading ? (
        <PlayersPageSkeleton />
      ) : groupedByPosition.length === 0 ? (
        <p className="text-muted">{t('common.noData')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groupedByPosition.map(([positionName, posPlayers]) => {
            const getBorderColorClass = (name: string) => {
              const enName =
                Object.entries({
                  [t('players.goalkeepers')]: 'Goalkeeper',
                  [t('players.defenders')]: 'Defender',
                  [t('players.midfielders')]: 'Midfielder',
                  [t('players.forwards')]: 'Forward',
                }).find(([k]) => k === name)?.[1] || name;

              if (enName.includes('Goalkeeper')) return 'border-yellow-500';
              if (enName.includes('Defender')) return 'border-blue-500';
              if (enName.includes('Midfielder')) return 'border-green-500';
              if (enName.includes('Forward')) return 'border-red-500';
              return 'border-gray-500';
            };
            return (
              <div key={positionName}>
                <h2
                  className={`text-lg font-bold mb-3 border-l-4 pl-2 ${getBorderColorClass(positionName)}`}
                >
                  {positionName}
                </h2>
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
                            {p.status === 1
                              ? t('common.active')
                              : t('common.inactive')}
                          </span>
                          <span className="text-md font-bold">
                            #{p.jerseyNumber ?? '-'}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {p.phone} &middot; {p.email}
                        </p>
                      </div>
                      {canManage && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleDelete(p.id);
                          }}
                          className="text-danger text-xs hover:bg-danger/20 px-2 py-1 rounded transition-all"
                        >
                          {t('common.delete')}
                        </button>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
