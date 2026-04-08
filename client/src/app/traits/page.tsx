'use client';

import { useEffect, useState } from 'react';
import { traitsService, usersService, userTraitsService } from '@/services';
import { useCanManage } from '@/hooks/use-can-manage';
import { useConfirm } from '@/contexts/confirm-context';
import { TraitsPageSkeleton } from '@/components/skeleton';
import type { Trait, User, UserTrait } from '@/types';

export default function TraitsPage() {
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [traits, setTraits] = useState<Trait[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [assignForm, setAssignForm] = useState({ userId: '', traitId: '', rating: '50' });
  const [showAssign, setShowAssign] = useState(false);
  const [playerTraits, setPlayerTraits] = useState<UserTrait[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  const load = async () => {
    setLoading(true);
    const [t, p] = await Promise.all([traitsService.getAll(), usersService.getAll()]);
    setTraits(t);
    setPlayers(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadPlayerTraits = async (userId: string) => {
    setSelectedPlayer(userId);
    if (!userId) { setPlayerTraits([]); return; }
    const ut = await userTraitsService.getByUser(userId);
    setPlayerTraits(ut);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Create Trait',
      message: `Create trait "${form.name}"?`,
      confirmText: 'Create',
    });
    if (!ok) return;
    await traitsService.create(form);
    setForm({ name: '', description: '' });
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Trait',
      message: 'Are you sure you want to delete this trait? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await traitsService.remove(id);
    load();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Assign Trait',
      message: `Assign trait with rating ${assignForm.rating}?`,
      confirmText: 'Assign',
    });
    if (!ok) return;
    await userTraitsService.assign({
      userId: assignForm.userId,
      traitId: assignForm.traitId,
      rating: Number(assignForm.rating),
    });
    setAssignForm({ userId: '', traitId: '', rating: '50' });
    setShowAssign(false);
    if (selectedPlayer) loadPlayerTraits(selectedPlayer);
  };

  const handleUpdateRating = async (utId: string, newRating: number) => {
    await userTraitsService.updateRating(utId, newRating);
    if (selectedPlayer) loadPlayerTraits(selectedPlayer);
  };

  const handleRemoveUserTrait = async (utId: string) => {
    await userTraitsService.remove(utId);
    if (selectedPlayer) loadPlayerTraits(selectedPlayer);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Traits Management</h1>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => { setShowAssign(!showAssign); setShowForm(false); }}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm transition-colors"
            >
              {showAssign ? 'Cancel' : 'Assign Trait'}
            </button>
            <button
              onClick={() => { setShowForm(!showForm); setShowAssign(false); }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Trait'}
            </button>
          </div>
        )}
      </div>

      {canManage && showForm && (
        <form onSubmit={handleCreate} className="bg-card p-4 rounded-lg mb-6 grid grid-cols-2 gap-4">
          <input
            placeholder="Trait name (e.g. Speed, Stamina)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
            required
          />
          <input
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
          />
          <button type="submit" className="col-span-2 bg-accent hover:bg-accent/80 text-white py-2 rounded-lg text-sm transition-colors">
            Create Trait
          </button>
        </form>
      )}

      {canManage && showAssign && (
        <form onSubmit={handleAssign} className="bg-card p-4 rounded-lg mb-6 grid grid-cols-3 gap-4">
          <select
            value={assignForm.userId}
            onChange={(e) => setAssignForm({ ...assignForm, userId: e.target.value })}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Select Player</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName}</option>
            ))}
          </select>
          <select
            value={assignForm.traitId}
            onChange={(e) => setAssignForm({ ...assignForm, traitId: e.target.value })}
            className="bg-background border border-border rounded px-3 py-2 text-sm"
            required
          >
            <option value="">Select Trait</option>
            {traits.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              value={assignForm.rating}
              onChange={(e) => setAssignForm({ ...assignForm, rating: e.target.value })}
              className="flex-1"
            />
            <span className="text-sm font-mono w-8">{assignForm.rating}</span>
          </div>
          <button type="submit" className="col-span-3 bg-primary hover:bg-primary-hover text-white py-2 rounded-lg text-sm transition-colors">
            Assign Trait
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traits List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">All Traits</h2>
          {loading ? (
            <TraitsPageSkeleton />
          ) : traits.length === 0 ? (
            <p className="text-muted">No traits yet.</p>
          ) : (
            <div className="space-y-2">
              {traits.map((t) => (
                <div key={t.id} className="bg-card hover:bg-card-hover p-3 rounded-lg flex items-center justify-between transition-colors group">
                  <div>
                    <span className="font-medium">{t.name}</span>
                    {t.description && <span className="text-sm text-muted ml-2">- {t.description}</span>}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="opacity-0 group-hover:opacity-100 text-danger text-xs hover:bg-danger/20 px-2 py-1 rounded transition-all"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Traits View */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Player Traits</h2>
          <select
            value={selectedPlayer}
            onChange={(e) => loadPlayerTraits(e.target.value)}
            className="bg-background border border-border rounded px-3 py-2 text-sm w-full mb-4"
          >
            <option value="">Select a player...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>{p.displayName} #{p.jerseyNumber}</option>
            ))}
          </select>

          {selectedPlayer && playerTraits.length === 0 && (
            <p className="text-muted text-sm">No traits assigned to this player.</p>
          )}

          {playerTraits.length > 0 && (
            <div className="space-y-3">
              {playerTraits.map((ut) => {
                const trait = traits.find((t) => t.id === ut.traitId);
                return (
                  <div key={ut.id} className="bg-card p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{trait?.name || ut.traitId}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{ut.rating}/100</span>
                        {canManage && (
                          <button
                            onClick={() => handleRemoveUserTrait(ut.id)}
                            className="text-danger text-xs hover:bg-danger/20 px-1 rounded"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={ut.rating}
                      onChange={(e) => handleUpdateRating(ut.id, Number(e.target.value))}
                      className="w-full"
                      disabled={!canManage}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
