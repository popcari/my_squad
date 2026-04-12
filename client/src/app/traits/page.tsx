'use client';

import { TraitsPageSkeleton } from '@/components/shared/skeleton';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  assignTraitSchema,
  createTraitSchema,
  type AssignTraitForm,
  type CreateTraitForm,
} from '@/schemas/trait.schema';
import { traitsService, usersService, userTraitsService } from '@/services';
import type { Trait, User, UserTrait } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';

export default function TraitsPage() {
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [traits, setTraits] = useState<Trait[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [playerTraits, setPlayerTraits] = useState<UserTrait[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');

  // Create Trait form
  const createForm = useForm<CreateTraitForm>({
    resolver: zodResolver(createTraitSchema),
    mode: 'onTouched',
    defaultValues: { name: '', description: '' },
  });

  const assignFormHook = useForm<AssignTraitForm>({
    resolver: zodResolver(assignTraitSchema),
    mode: 'onTouched',
    defaultValues: { userId: '', traitId: '', rating: 50 },
  });
  const { handleSubmit: handleAssignSubmit } = assignFormHook;

  const reload = async () => {
    const [t, p] = await Promise.all([
      traitsService.getAll(),
      usersService.getAll(),
    ]);
    setTraits(t);
    setPlayers(p);
    setLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  const loadPlayerTraits = async (userId: string) => {
    setSelectedPlayer(userId);
    if (!userId) {
      setPlayerTraits([]);
      return;
    }
    const ut = await userTraitsService.getByUser(userId);
    setPlayerTraits(ut);
  };

  const handleCreate = async (data: CreateTraitForm) => {
    const ok = await confirm({
      title: 'Create Trait',
      message: `Create trait "${data.name}"?`,
      confirmText: 'Create',
    });
    if (!ok) return;
    await traitsService.create(data);
    createForm.reset();
    setShowForm(false);
    setLoading(true);
    await reload();
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Delete Trait',
      message:
        'Are you sure you want to delete this trait? This action cannot be undone.',
      confirmText: 'Delete',
      danger: true,
    });
    if (!ok) return;
    await traitsService.remove(id);
    setLoading(true);
    await reload();
  };

  const handleAssign: SubmitHandler<AssignTraitForm> = async (data) => {
    const ok = await confirm({
      title: 'Assign Trait',
      message: `Assign trait with rating ${data.rating}?`,
      confirmText: 'Assign',
    });
    if (!ok) return;
    await userTraitsService.assign({
      userId: data.userId,
      traitId: data.traitId,
      rating: data.rating,
    });
    assignFormHook.reset();
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
              onClick={() => {
                setShowAssign(!showAssign);
                setShowForm(false);
              }}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm transition-colors"
            >
              {showAssign ? 'Cancel' : 'Assign Trait'}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowAssign(false);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
            >
              {showForm ? 'Cancel' : '+ New Trait'}
            </button>
          </div>
        )}
      </div>

      {canManage && showForm && (
        <form
          onSubmit={createForm.handleSubmit(handleCreate)}
          className="bg-card p-4 rounded-lg mb-6 grid grid-cols-2 gap-4"
        >
          <InputText
            placeholder="Trait name (e.g. Speed, Stamina)"
            error={createForm.formState.errors.name}
            required
            {...createForm.register('name')}
          />
          <InputText
            placeholder="Description (optional)"
            {...createForm.register('description')}
          />
          <button
            type="submit"
            disabled={createForm.formState.isSubmitting}
            className="col-span-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {createForm.formState.isSubmitting ? 'Creating...' : 'Create Trait'}
          </button>
        </form>
      )}

      {canManage && showAssign && (
        <form
          onSubmit={handleAssignSubmit(handleAssign)}
          className="bg-card p-4 rounded-lg mb-6 grid grid-cols-3 gap-4"
        >
          <Controller
            name="userId"
            control={assignFormHook.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="text-sm"
                required
              >
                <option value="">Select Player</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.displayName}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            name="traitId"
            control={assignFormHook.control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="text-sm"
                required
              >
                <option value="">Select Trait</option>
                {traits.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          />
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              {...assignFormHook.register('rating', { valueAsNumber: true })}
              className="flex-1"
            />
            <span className="text-sm font-mono w-8">{assignFormHook.watch('rating')}</span>
          </div>
          <button
            type="submit"
            disabled={assignFormHook.formState.isSubmitting}
            className="col-span-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {assignFormHook.formState.isSubmitting ? 'Assigning...' : 'Assign Trait'}
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
                <div
                  key={t.id}
                  className="bg-card hover:bg-card-hover p-3 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div>
                    <span className="font-medium">{t.name}</span>
                    {t.description && (
                      <span className="text-sm text-muted ml-2">
                        - {t.description}
                      </span>
                    )}
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
          <Select
            value={selectedPlayer}
            onChange={(e) => loadPlayerTraits(e.target.value)}
            className="text-sm w-full mb-4"
          >
            <option value="">Select a player...</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} #{p.jerseyNumber}
              </option>
            ))}
          </Select>

          {selectedPlayer && playerTraits.length === 0 && (
            <p className="text-muted text-sm">
              No traits assigned to this player.
            </p>
          )}

          {playerTraits.length > 0 && (
            <div className="space-y-3">
              {playerTraits.map((ut) => {
                const trait = traits.find((t) => t.id === ut.traitId);
                return (
                  <div key={ut.id} className="bg-card p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {trait?.name || ut.traitId}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">
                          {ut.rating}/100
                        </span>
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
                      onChange={(e) =>
                        handleUpdateRating(ut.id, Number(e.target.value))
                      }
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
