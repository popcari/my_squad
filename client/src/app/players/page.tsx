'use client';

import { PlayersPageSkeleton } from '@/components/shared/skeleton';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import { usePlayersByPositionGroup } from '@/hooks/use-players-by-position-group';

import {
  positionsService,
  userPositionsService,
  usersService,
} from '@/services';
import type { Position, User, UserPosition } from '@/types';
import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

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

  const { groups: playerGroups } = usePlayersByPositionGroup({
    players,
    positions,
    userPositions: allUserPositions,
  });

  // Drop empty groups for display (eg. no GK on team yet → don't render header).
  const visibleGroups = playerGroups.filter((g) => g.players.length > 0);

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
      ) : visibleGroups.length === 0 ? (
        <p className="text-muted">{t('common.noData')}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleGroups.map((group) => {
            return (
              <div key={group.key}>
                <h2
                  className={`text-lg font-bold mb-3 border-l-4 pl-2 ${group.borderClass}`}
                >
                  {t(group.labelKey)}
                </h2>
                <div className="space-y-1">
                  {group.players.map((p) => (
                    <Link
                      key={`${group.key}-${p.id}`}
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
                          aria-label={t('common.delete')}
                          className="p-1.5 text-danger hover:bg-danger/20 rounded"
                        >
                          <Trash2 size={14} />
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
