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

type SortKey = 'jerseyNumber' | 'displayName' | 'email' | 'position';
type SortDir = 'asc' | 'desc';

interface PlayerRow extends User {
  positionNames: string;
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
  const [sortKey, setSortKey] = useState<SortKey>('jerseyNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const load = async () => {
    setLoading(true);
    const [p, pos] = await Promise.all([
      usersService.getAll(),
      positionsService.getAll(),
    ]);
    setPlayers(p);
    setPositions(pos);

    // Load positions for all players
    const upResults = await Promise.all(
      p.map((u) => userPositionsService.getByUser(u.id)),
    );
    setAllUserPositions(upResults.flat());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Build rows with position names
  const rows: PlayerRow[] = useMemo(() => {
    return players.map((p) => {
      const userPosIds = allUserPositions
        .filter((up) => up.userId === p.id)
        .map((up) => up.positionId);
      const names = userPosIds
        .map((id) => positions.find((pos) => pos.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      return { ...p, positionNames: names || '-' };
    });
  }, [players, allUserPositions, positions]);

  // Sort rows
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'jerseyNumber':
          cmp = (a.jerseyNumber ?? 0) - (b.jerseyNumber ?? 0);
          break;
        case 'displayName':
          cmp = a.displayName.localeCompare(b.displayName);
          break;
        case 'email':
          cmp = a.email.localeCompare(b.email);
          break;
        case 'position':
          cmp = a.positionNames.localeCompare(b.positionNames);
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return '↕';
    return sortDir === 'asc' ? '↑' : '↓';
  };

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
    load();
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
    load();
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
      ) : sortedRows.length === 0 ? (
        <p className="text-muted">No players yet.</p>
      ) : (
        <div className="bg-card rounded-lg overflow-x-auto border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card-hover">
                <th
                  className="text-left px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground transition-colors select-none w-20"
                  onClick={() => handleSort('jerseyNumber')}
                >
                  <span className="flex items-center gap-1">
                    # {sortIcon('jerseyNumber')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('displayName')}
                >
                  <span className="flex items-center gap-1">
                    Name {sortIcon('displayName')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('email')}
                >
                  <span className="flex items-center gap-1">
                    Email {sortIcon('email')}
                  </span>
                </th>
                <th
                  className="text-left px-4 py-3 font-medium text-muted cursor-pointer hover:text-foreground transition-colors select-none"
                  onClick={() => handleSort('position')}
                >
                  <span className="flex items-center gap-1">
                    Position {sortIcon('position')}
                  </span>
                </th>
                {canManage && <th className="w-16 px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border last:border-b-0 hover:bg-card-hover transition-colors group"
                >
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                      {p.jerseyNumber ?? '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/players/${p.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {p.displayName}
                    </Link>
                    <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary capitalize">
                      {p.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.email}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.positionNames === '-' ? (
                        <span className="text-muted">-</span>
                      ) : (
                        p.positionNames.split(', ').map((name) => (
                          <span
                            key={name}
                            className="text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent"
                          >
                            {name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  {canManage && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="w-8 h-8 flex items-center justify-center text-danger hover:bg-danger/20 rounded-lg transition-all"
                        title="Delete player"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
