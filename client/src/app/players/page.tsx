'use client';

import { PlayersPageSkeleton } from '@/components/skeleton';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  positionsService,
  userPositionsService,
  usersService,
} from '@/services';
import type { Position, User, UserPosition } from '@/types';
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
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: '',
    displayName: '',
    role: 'player' as const,
    jerseyNumber: '',
  });
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);

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
    reload();
  }, []);

  // Build players with position names
  const playersWithPositions: PlayerWithPositions[] = useMemo(() => {
    return players.map((p) => {
      const userPosIds = allUserPositions
        .filter((up) => up.userId === p.id)
        .map((up) => up.positionId);
      const names = userPosIds
        .map((id) => positions.find((pos) => pos.id === id)?.name)
        .filter((n): n is string => Boolean(n));
      return { ...p, positionNames: names };
    });
  }, [players, allUserPositions, positions]);

  // Group players by position, sorted by jersey number within each group
  const groupedByPosition = useMemo(() => {
    const groups: Record<string, PlayerWithPositions[]> = {};

    for (const player of playersWithPositions) {
      const posNames =
        player.positionNames.length > 0
          ? player.positionNames
          : ['Unassigned'];
      for (const name of posNames) {
        if (!groups[name]) groups[name] = [];
        groups[name].push(player);
      }
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
  }, [playersWithPositions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Create Player',
      message: `Add ${form.displayName} to the squad?`,
      confirmText: 'Create',
    });
    if (!ok) return;
    const user = await usersService.create({
      ...form,
      jerseyNumber: form.jerseyNumber ? Number(form.jerseyNumber) : undefined,
    });
    for (const posId of selectedPositions) {
      await userPositionsService.assign({ userId: user.id, positionId: posId });
    }
    setForm({ email: '', displayName: '', role: 'player', jerseyNumber: '' });
    setSelectedPositions([]);
    setShowForm(false);
    setLoading(true);
    await reload();
  };

  const togglePosition = (posId: string) => {
    setSelectedPositions((prev) =>
      prev.includes(posId) ? prev.filter((p) => p !== posId) : [...prev, posId],
    );
  };

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
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
          >
            {showForm ? 'Cancel' : '+ Add Player'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <form
          onSubmit={handleCreate}
          className="bg-card p-4 rounded-lg mb-6 space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Display Name"
              value={form.displayName}
              onChange={(e) =>
                setForm({ ...form, displayName: e.target.value })
              }
              className="bg-background border border-border rounded px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="bg-background border border-border rounded px-3 py-2 text-sm"
              required
            />
            <input
              placeholder="Jersey # (1-99)"
              type="number"
              min={1}
              max={99}
              value={form.jerseyNumber}
              onChange={(e) =>
                setForm({ ...form, jerseyNumber: e.target.value })
              }
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            />
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as 'player' })
              }
              className="bg-background border border-border rounded px-3 py-2 text-sm"
            >
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="president">President</option>
            </select>
          </div>
          <div>
            <p className="text-sm text-muted mb-2">Positions:</p>
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => togglePosition(pos.id)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors ${
                    selectedPositions.includes(pos.id)
                      ? 'bg-primary text-white'
                      : 'bg-card-hover text-muted hover:text-foreground'
                  }`}
                >
                  {pos.name}
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-accent hover:bg-accent/80 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Create Player
          </button>
        </form>
      )}

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
                        <img
                          src={p.avatar}
                          alt={p.displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary font-bold text-sm">
                          {p.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                        {p.displayName}
                      </p>
                      <p className="text-xs text-muted">
                        {p.jerseyNumber ?? '-'} &middot; {p.email}
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
