'use client';

import { TraitsPageSkeleton } from '@/components/shared/skeleton';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
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
import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export default function TraitsPage() {
  const { t } = useTranslation();
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
    defaultValues: { userId: '', traitId: '', rating: 3 },
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
    const load = async () => {
      const [ts, ps] = await Promise.all([
        traitsService.getAll(),
        usersService.getAll(),
      ]);
      setTraits(ts);
      setPlayers(ps);
      setLoading(false);
    };
    load();
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
      title: t('traits.createTrait'),
      message: t('traits.createTraitConfirm', { name: data.name }),
      confirmText: t('common.create'),
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
      title: t('traits.deleteTrait'),
      message: t('traits.deleteTraitConfirm'),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await traitsService.remove(id);
    setLoading(true);
    await reload();
  };

  const handleAssign: SubmitHandler<AssignTraitForm> = async (data) => {
    const ok = await confirm({
      title: t('traits.assignTrait'),
      message: t('traits.assignTraitConfirm', { rating: data.rating }),
      confirmText: t('common.assign'),
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
        <h1 className="text-2xl font-bold">{t('traits.title')}</h1>
        {canManage && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowAssign(!showAssign);
                setShowForm(false);
              }}
              className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm transition-colors"
            >
              {showAssign ? t('common.cancel') : t('traits.assignTrait')}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowAssign(false);
              }}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
            >
              {showForm ? t('common.cancel') : t('traits.newTrait')}
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
            placeholder={t('traits.traitName')}
            error={createForm.formState.errors.name}
            required
            {...createForm.register('name')}
          />
          <InputText
            placeholder={t('traits.descriptionOptional')}
            {...createForm.register('description')}
          />
          <button
            type="submit"
            disabled={createForm.formState.isSubmitting}
            className="col-span-2 bg-accent hover:bg-accent/80 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {createForm.formState.isSubmitting
              ? t('common.creating')
              : t('traits.createTrait')}
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
                <option value="">{t('traits.selectPlayer')}</option>
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
                <option value="">{t('traits.selectTrait')}</option>
                {traits.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            )}
          />
          <Controller
            name="rating"
            control={assignFormHook.control}
            render={({ field }) => (
              <div className="flex items-center gap-2">
                <StarRating value={field.value} onChange={field.onChange} size={22} />
                <span className="text-sm font-mono w-10">{field.value}</span>
              </div>
            )}
          />
          <button
            type="submit"
            disabled={assignFormHook.formState.isSubmitting}
            className="col-span-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
          >
            {assignFormHook.formState.isSubmitting
              ? t('common.creating')
              : t('traits.assignTrait')}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traits List */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {t('traits.allTraits')}
          </h2>
          {loading ? (
            <TraitsPageSkeleton />
          ) : traits.length === 0 ? (
            <p className="text-muted">{t('traits.noTraits')}</p>
          ) : (
            <div className="space-y-2">
              {traits.map((trait) => (
                <div
                  key={trait.id}
                  className="bg-card hover:bg-card-hover p-3 rounded-lg flex items-center justify-between transition-colors group"
                >
                  <div>
                    <span className="font-medium">{trait.name}</span>
                    {trait.description && (
                      <span className="text-sm text-muted ml-2">
                        - {trait.description}
                      </span>
                    )}
                  </div>
                  {canManage && (
                    <button
                      onClick={() => handleDelete(trait.id)}
                      aria-label={t('common.delete')}
                      className="p-1.5 text-danger hover:bg-danger/20 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Player Traits View */}
        <div>
          <h2 className="text-lg font-semibold mb-3">
            {t('traits.playerTraits')}
          </h2>
          <Select
            value={selectedPlayer}
            onChange={(e) => loadPlayerTraits(e.target.value)}
            className="text-sm w-full mb-4"
          >
            <option value="">{t('traits.selectPlayer')}</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName} #{p.jerseyNumber}
              </option>
            ))}
          </Select>

          {selectedPlayer && playerTraits.length === 0 && (
            <p className="text-muted text-sm">{t('traits.noPlayerTraits')}</p>
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
                        {canManage && (
                          <button
                            onClick={() => handleRemoveUserTrait(ut.id)}
                            aria-label={t('common.remove')}
                            className="p-1 text-danger hover:bg-danger/20 rounded"
                          >
                            X
                          </button>
                        )}
                      </div>
                    </div>
                    <StarRating
                      value={ut.rating}
                      onChange={(v) => handleUpdateRating(ut.id, v)}
                      readOnly={!canManage}
                      size={20}
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
