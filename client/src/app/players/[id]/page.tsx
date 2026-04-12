'use client';

import { AvatarPickerModal } from '@/components/avatar-picker-modal';
import { PlayerProfilePageSkeleton } from '@/components/shared/skeleton';
import { InputText } from '@/components/ui/input-text';
import { Lightbox } from '@/components/ui/lightbox';
import { Select } from '@/components/ui/select';
import { USER_ROLE } from '@/constant/enum';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import { useCurrentUser } from '@/hooks/use-current-user';
import {
  matchesService,
  positionsService,
  traitsService,
  userPositionsService,
  userTraitsService,
  usersService,
} from '@/services';
import type { Match, MatchGoal, PlayerProfile, Position, Trait } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = params.id as string;
  const canManage = useCanManage();
  const currentUser = useCurrentUser();
  const confirm = useConfirm();

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [allPositions, setAllPositions] = useState<Position[]>([]);
  const [allTraits, setAllTraits] = useState<Trait[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    jerseyNumber: '',
    role: '' as string,
  });
  const [saving, setSaving] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Assign trait state
  const [showAssignTrait, setShowAssignTrait] = useState(false);
  const [assignTraitForm, setAssignTraitForm] = useState({
    traitId: '',
    rating: '50',
  });

  const [matches, setMatches] = useState<Match[]>([]);
  const [goals, setGoals] = useState<MatchGoal[]>([]);
  const [filterMonth, setFilterMonth] = useState<string>('');

  const reload = async () => {
    const [p, pos, traits, m, g] = await Promise.all([
      usersService.getProfile(playerId),
      positionsService.getAll(),
      traitsService.getAll(),
      matchesService.getAll(),
      matchesService.getAllGoals(),
    ]);
    setProfile(p);
    setAllPositions(pos);
    setAllTraits(traits);
    setMatches(m || []);
    setGoals(
      (g || []).filter(
        (goal) => goal.scorerId === playerId || goal.assistId === playerId,
      ),
    );
    setLoading(false);
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const startEdit = () => {
    if (
      !profile ||
      (currentUser?.id !== playerId &&
        currentUser?.email !== 'admin@example.com')
    )
      return;
    setEditForm({
      displayName: profile.displayName,
      jerseyNumber: profile.jerseyNumber?.toString() || '',
      role: profile.role,
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!profile) return;
    setSaving(true);
    await usersService.update(playerId, {
      displayName: editForm.displayName,
      jerseyNumber: editForm.jerseyNumber
        ? Number(editForm.jerseyNumber)
        : undefined,
      role: editForm.role as PlayerProfile['role'],
    });
    await reload();
    setSaving(false);
    setEditing(false);
  };

  const handleAvatarSelected = async () => {
    setShowAvatarPicker(false);
    await reload();
  };

  // Position management
  const handleSetPrimary = async (positionId: string) => {
    if (!profile) return;
    // Remove existing primary if any
    const existingPrimary = profile.positions.find(
      (up) => up.type === 'primary',
    );
    if (existingPrimary) {
      await userPositionsService.remove(existingPrimary.id);
    }
    // Remove this position if it was a sub
    const existingSub = profile.positions.find(
      (up) => up.positionId === positionId && up.type === 'sub',
    );
    if (existingSub) {
      await userPositionsService.remove(existingSub.id);
    }
    await userPositionsService.assign({
      userId: playerId,
      positionId,
      type: 'primary',
    });
    await reload();
  };

  const handleToggleSub = async (positionId: string) => {
    if (!profile) return;
    const existing = profile.positions.find(
      (up) => up.positionId === positionId,
    );
    if (existing) {
      await userPositionsService.remove(existing.id);
    } else {
      await userPositionsService.assign({
        userId: playerId,
        positionId,
        type: 'sub',
      });
    }
    await reload();
  };

  // Trait management
  const handleAssignTrait = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTraitForm.traitId) return;
    await userTraitsService.assign({
      userId: playerId,
      traitId: assignTraitForm.traitId,
      rating: Number(assignTraitForm.rating),
    });
    setAssignTraitForm({ traitId: '', rating: '50' });
    setShowAssignTrait(false);
    await reload();
  };

  const handleUpdateRating = async (utId: string, rating: number) => {
    await userTraitsService.updateRating(utId, rating);
    await reload();
  };

  const handleRemoveTrait = async (utId: string) => {
    const ok = await confirm({
      title: 'Remove Trait',
      message: 'Remove this trait from the player?',
      confirmText: 'Remove',
      danger: true,
    });
    if (!ok) return;
    await userTraitsService.remove(utId);
    await reload();
  };

  const monthlyStats = useMemo(() => {
    const stats: Record<
      string,
      { month: string; goals: number; assists: number }
    > = {};
    matches.forEach((m) => {
      const monthStr = m.matchDate.substring(0, 7);
      if (!stats[monthStr]) {
        stats[monthStr] = { month: monthStr, goals: 0, assists: 0 };
      }
    });

    goals.forEach((g) => {
      const match = matches.find((m) => m.id === g.matchId);
      if (match) {
        const monthStr = match.matchDate.substring(0, 7);
        if (g.scorerId === playerId) stats[monthStr].goals += 1;
        if (g.assistId === playerId) stats[monthStr].assists += 1;
      }
    });

    let data = Object.values(stats).sort((a, b) =>
      a.month.localeCompare(b.month),
    );
    if (filterMonth) {
      data = data.filter((d) => d.month === filterMonth);
    }
    return data;
  }, [goals, matches, filterMonth, playerId]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    matches.forEach((m) => months.add(m.matchDate.substring(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [matches]);

  const displayStats = useMemo(() => {
    if (!filterMonth) return profile?.stats || { goals: 0, assists: 0 };
    return monthlyStats.reduce(
      (acc, curr) => {
        acc.goals += curr.goals;
        acc.assists += curr.assists;
        return acc;
      },
      { goals: 0, assists: 0 },
    );
  }, [monthlyStats, filterMonth, profile?.stats]);

  if (loading) return <PlayerProfilePageSkeleton />;
  if (!profile) return <p className="text-danger">Player not found.</p>;

  const assignedTraitIds = profile.traits.map((ut) => ut.traitId);
  const unassignedTraits = allTraits.filter(
    (t) => !assignedTraitIds.includes(t.id),
  );

  const maxRating = 100;

  return (
    <div>
      <Link
        href="/players"
        className="text-sm text-muted hover:text-primary mb-4 inline-block"
      >
        &larr; Back
      </Link>

      {/* Profile Header */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative group">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold overflow-hidden">
              {profile.avatar ? (
                editing ? (
                  <Image
                    src={profile.avatar}
                    alt={profile.displayName}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Lightbox src={profile.avatar} alt={profile.displayName}>
                    <Image
                      src={profile.avatar}
                      alt={profile.displayName}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  </Lightbox>
                )
              ) : (
                profile.jerseyNumber || '#'
              )}
            </div>
            {editing && currentUser?.id === playerId && (
              <button
                onClick={() => setShowAvatarPicker(true)}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity"
              >
                Change
              </button>
            )}
          </div>

          <div className="flex-1">
            {editing ? (
              <div className="space-y-2 alo">
                <InputText
                  value={editForm.displayName}
                  onChange={(e) =>
                    setEditForm({ ...editForm, displayName: e.target.value })
                  }
                  className="text-lg font-bold"
                />
                <div className="flex gap-2">
                  <div className="w-[50%] md:w-[25%]">
                    <InputText
                      type="number"
                      min={1}
                      max={99}
                      placeholder="Jersey #"
                      value={editForm.jerseyNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          jerseyNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="w-[50%] md:w-[75%]">
                    <Select
                      value={editForm.role}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role: e.target.value })
                      }
                      className="text-sm"
                      disabled={!canManage}
                    >
                      <option value={USER_ROLE.PLAYER}>Player</option>
                      <option value={USER_ROLE.COACH}>Coach</option>
                      <option value={USER_ROLE.PRESIDENT}>President</option>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="px-3 py-1 bg-primary hover:bg-primary-hover text-white rounded text-sm transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 bg-card-hover hover:bg-border text-foreground rounded text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{profile.displayName}</h1>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      profile.status === 1
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {profile.status === 1 ? 'Active' : 'Inactive'}
                  </span>
                  {(currentUser?.id === playerId ||
                    currentUser?.email === 'admin@example.com') && (
                    <button
                      onClick={startEdit}
                      className="text-muted hover:text-primary text-sm transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <p className="text-sm text-muted">
                  {profile.phone} &middot; {profile.email}
                </p>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {profile.positions
                    .slice()
                    .sort((a, b) =>
                      a.type === 'primary' ? -1 : b.type === 'primary' ? 1 : 0,
                    )
                    .map((up) => {
                      const pos = allPositions.find(
                        (p) => p.id === up.positionId,
                      );
                      const isPrimary = up.type === 'primary';
                      return (
                        <span
                          key={up.id}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            isPrimary
                              ? 'bg-primary text-white'
                              : 'bg-primary/10 text-primary'
                          }`}
                        >
                          {pos?.name || up.positionId}
                        </span>
                      );
                    })}
                  <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-medium capitalize">
                    {profile.role}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Positions */}
        {profile && (
          <div className="bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Positions</h2>

            <div className="mb-4">
              <p className="text-xs text-muted mb-2 uppercase tracking-wide">
                Primary Position (click to set)
              </p>
              <div className="flex flex-wrap gap-2">
                {allPositions.map((pos) => {
                  const up = profile.positions.find(
                    (p) => p.positionId === pos.id,
                  );
                  const isPrimary = up?.type === 'primary';
                  return (
                    <button
                      key={pos.id}
                      onClick={() => handleSetPrimary(pos.id)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        isPrimary
                          ? 'bg-primary text-white'
                          : 'bg-card-hover text-muted hover:text-foreground'
                      }`}
                    >
                      {pos.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs text-muted mb-2 uppercase tracking-wide">
                Sub Positions (click to toggle)
              </p>
              <div className="flex flex-wrap gap-2">
                {allPositions.map((pos) => {
                  const up = profile.positions.find(
                    (p) => p.positionId === pos.id,
                  );
                  const isPrimary = up?.type === 'primary';
                  const isSub = up?.type === 'sub';
                  return (
                    <button
                      key={pos.id}
                      onClick={() => handleToggleSub(pos.id)}
                      disabled={isPrimary}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                        isPrimary
                          ? 'bg-primary/30 text-primary/50 cursor-not-allowed'
                          : isSub
                            ? 'bg-accent text-white'
                            : 'bg-card-hover text-muted hover:text-foreground'
                      }`}
                    >
                      {pos.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Traits */}
        <div className="bg-card rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Traits</h2>
            {canManage && unassignedTraits.length > 0 && (
              <button
                onClick={() => setShowAssignTrait(!showAssignTrait)}
                className="text-sm text-primary hover:text-primary-hover transition-colors"
              >
                {showAssignTrait ? 'Cancel' : '+ Assign'}
              </button>
            )}
          </div>

          {canManage && showAssignTrait && (
            <form
              onSubmit={handleAssignTrait}
              className="bg-background p-3 rounded-lg mb-4 space-y-2"
            >
              <Select
                value={assignTraitForm.traitId}
                onChange={(e) =>
                  setAssignTraitForm({
                    ...assignTraitForm,
                    traitId: e.target.value,
                  })
                }
                className="text-sm w-full"
                required
              >
                <option value="">Select trait...</option>
                {unassignedTraits.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={assignTraitForm.rating}
                  onChange={(e) =>
                    setAssignTraitForm({
                      ...assignTraitForm,
                      rating: e.target.value,
                    })
                  }
                  className="flex-1"
                />
                <span className="text-sm font-mono w-8">
                  {assignTraitForm.rating}
                </span>
              </div>
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-hover text-white py-1.5 rounded text-sm transition-colors"
              >
                Assign
              </button>
            </form>
          )}

          {profile.traits.length === 0 ? (
            <p className="text-sm text-muted">No traits assigned yet.</p>
          ) : (
            <div className="space-y-3">
              {profile.traits.map((ut) => {
                const trait = allTraits.find((t) => t.id === ut.traitId);
                return (
                  <div key={ut.id} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{trait?.name || ut.traitId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted">
                          {ut.rating}/{maxRating}
                        </span>
                        {canManage && (
                          <button
                            onClick={() => handleRemoveTrait(ut.id)}
                            className="opacity-0 group-hover:opacity-100 text-danger text-xs hover:bg-danger/20 px-1 rounded transition-all"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-background rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2 transition-all"
                          style={{
                            width: `${(ut.rating / maxRating) * 100}%`,
                          }}
                        />
                      </div>
                      {canManage && (
                        <input
                          type="range"
                          min={1}
                          max={100}
                          value={ut.rating}
                          onChange={(e) =>
                            handleUpdateRating(ut.id, Number(e.target.value))
                          }
                          className="w-24"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Stats Below */}
      <div className="bg-card rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Stats</h2>
          <div className="w-[150px]">
            <Select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All Time</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">
              {displayStats.goals}
            </div>
            <div className="text-sm text-muted">Goals</div>
          </div>
          <div className="bg-background rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-accent">
              {displayStats.assists}
            </div>
            <div className="text-sm text-muted">Assists</div>
          </div>
        </div>

        {monthlyStats.length > 0 ? (
          <div className="h-[300px] w-full bg-background p-4 rounded-lg">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyStats}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  opacity={0.2}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: 'currentColor', opacity: 0.1 }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                />
                <Bar
                  dataKey="goals"
                  fill="#2563eb"
                  name="Goals"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Bar
                  dataKey="assists"
                  fill="#d97706"
                  name="Assists"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[200px] w-full bg-background flex items-center justify-center rounded-lg">
            <span className="text-muted text-sm">No match data available.</span>
          </div>
        )}
      </div>

      {showAvatarPicker && (
        <AvatarPickerModal
          userId={playerId}
          onSelect={handleAvatarSelected}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </div>
  );
}
