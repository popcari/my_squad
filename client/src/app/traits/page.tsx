'use client';

import { Drawer } from '@/components/drawer';
import { TraitsPageSkeleton } from '@/components/shared/skeleton';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { StarRating } from '@/components/ui/star-rating';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  createTraitSchema,
  type CreateTraitForm,
} from '@/schemas/trait.schema';
import { traitsService, usersService, userTraitsService } from '@/services';
import type { Trait, User, UserTrait } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings2, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export default function TraitsPage() {
  const { t } = useTranslation();
  const canManage = useCanManage();
  const confirm = useConfirm();

  const [traits, setTraits] = useState<Trait[]>([]);
  const [players, setPlayers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [playerTraits, setPlayerTraits] = useState<UserTrait[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [search, setSearch] = useState('');

  // Inline add-trait picker
  const [pendingTraitId, setPendingTraitId] = useState('');
  const [pendingRating, setPendingRating] = useState(3);

  const createForm = useForm<CreateTraitForm>({
    resolver: zodResolver(createTraitSchema),
    mode: 'onTouched',
    defaultValues: { name: '', description: '' },
  });

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

  const reloadTraits = async () => {
    const ts = await traitsService.getAll();
    setTraits(ts);
  };

  const loadPlayerTraits = async (userId: string) => {
    setSelectedPlayer(userId);
    setPendingTraitId('');
    setPendingRating(3);
    if (!userId) {
      setPlayerTraits([]);
      return;
    }
    const ut = await userTraitsService.getByUser(userId);
    setPlayerTraits(ut);
  };

  const refreshCurrentPlayer = async () => {
    if (selectedPlayer) {
      const ut = await userTraitsService.getByUser(selectedPlayer);
      setPlayerTraits(ut);
    }
  };

  const handleCreateTrait = async (data: CreateTraitForm) => {
    const ok = await confirm({
      title: t('traits.createTrait'),
      message: t('traits.createTraitConfirm', { name: data.name }),
      confirmText: t('common.create'),
    });
    if (!ok) return;
    await traitsService.create(data);
    createForm.reset();
    await reloadTraits();
  };

  const handleDeleteTrait = async (id: string) => {
    const ok = await confirm({
      title: t('traits.deleteTrait'),
      message: t('traits.deleteTraitConfirm'),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await traitsService.remove(id);
    await reloadTraits();
    await refreshCurrentPlayer();
  };

  const handleAddTrait = async () => {
    if (!selectedPlayer || !pendingTraitId) return;
    await userTraitsService.assign({
      userId: selectedPlayer,
      traitId: pendingTraitId,
      rating: pendingRating,
    });
    setPendingTraitId('');
    setPendingRating(3);
    await refreshCurrentPlayer();
  };

  const handleUpdateRating = async (utId: string, newRating: number) => {
    await userTraitsService.updateRating(utId, newRating);
    await refreshCurrentPlayer();
  };

  const handleRemoveUserTrait = async (utId: string) => {
    await userTraitsService.remove(utId);
    await refreshCurrentPlayer();
  };

  const filteredPlayers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return players;
    return players.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) ||
        String(p.jerseyNumber ?? '').includes(q),
    );
  }, [players, search]);

  const selectedPlayerObj = useMemo(
    () => players.find((p) => p.id === selectedPlayer),
    [players, selectedPlayer],
  );

  const unassignedTraits = useMemo(() => {
    const assignedIds = new Set(playerTraits.map((ut) => ut.traitId));
    return traits.filter((tr) => !assignedIds.has(tr.id));
  }, [traits, playerTraits]);

  if (loading) return <TraitsPageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('traits.title')}</h1>
        {canManage && (
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-hover border border-border text-foreground rounded-lg text-sm transition-colors"
          >
            <Settings2 size={16} />
            {t('traits.managePool')}
          </button>
        )}
      </div>

      {/* Master-detail */}
      <div className="grid grid-cols-1 md:grid-cols-[280px,1fr] gap-4 md:gap-6 items-start">
        {/* Player list */}
        <aside className="bg-card rounded-lg p-3 flex flex-col gap-2 md:max-h-[70vh] md:overflow-y-auto">
          <InputText
            placeholder={t('traits.searchPlayers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filteredPlayers.length === 0 ? (
            <p className="text-xs text-muted px-2 py-4">{t('common.noData')}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredPlayers.map((p) => {
                const isActive = selectedPlayer === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => loadPlayerTraits(p.id)}
                      className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors ${
                        isActive
                          ? 'bg-primary text-white'
                          : 'hover:bg-card-hover text-foreground'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden text-[10px] font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-primary/20 text-primary'
                        }`}
                      >
                        {p.avatar ? (
                          <Image
                            src={p.avatar}
                            alt={p.displayName}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          initialsOf(p.displayName)
                        )}
                      </span>
                      <span
                        className={`text-[11px] font-bold shrink-0 ${
                          isActive ? 'text-white/80' : 'text-primary'
                        }`}
                      >
                        #{p.jerseyNumber ?? '-'}
                      </span>
                      <span className="flex-1 text-sm truncate">
                        {p.displayName}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* Detail */}
        <section className="bg-card rounded-lg p-4 md:p-6 min-h-[300px]">
          {!selectedPlayerObj ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-muted text-sm">
              <p>{t('traits.chooseAPlayer')}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5 pb-3 border-b border-border">
                <span className="w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center overflow-hidden">
                  {selectedPlayerObj.avatar ? (
                    <Image
                      src={selectedPlayerObj.avatar}
                      alt={selectedPlayerObj.displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initialsOf(selectedPlayerObj.displayName)
                  )}
                </span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold">
                    {selectedPlayerObj.displayName}
                  </h2>
                  <p className="text-xs text-muted">
                    #{selectedPlayerObj.jerseyNumber ?? '-'} ·{' '}
                    {playerTraits.length}/{traits.length} traits
                  </p>
                </div>
              </div>

              {playerTraits.length === 0 ? (
                <p className="text-sm text-muted py-2">
                  {t('traits.noPlayerTraits')}
                </p>
              ) : (
                <ul className="flex flex-col gap-3 mb-4">
                  {playerTraits.map((ut) => {
                    const trait = traits.find((tr) => tr.id === ut.traitId);
                    return (
                      <li
                        key={ut.id}
                        className="flex items-center gap-3 bg-background rounded-lg p-3"
                      >
                        <span className="flex-1 text-sm font-medium truncate">
                          {trait?.name || ut.traitId}
                        </span>
                        <StarRating
                          value={ut.rating}
                          onChange={(v) => handleUpdateRating(ut.id, v)}
                          readOnly={!canManage}
                          size={18}
                        />
                        {canManage && (
                          <button
                            onClick={() => handleRemoveUserTrait(ut.id)}
                            aria-label={t('common.remove')}
                            className="p-1 text-danger hover:bg-danger/20 rounded shrink-0"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Inline add-trait picker */}
              {canManage && (
                <>
                  {traits.length === 0 ? (
                    <p className="text-xs text-muted italic">
                      {t('traits.emptyPool')}
                    </p>
                  ) : unassignedTraits.length === 0 ? (
                    <p className="text-xs text-muted italic">
                      {t('traits.allAssigned')}
                    </p>
                  ) : (
                    <div className="bg-background rounded-lg p-3 flex flex-col gap-3">
                      <Select
                        value={pendingTraitId}
                        onChange={(e) => setPendingTraitId(e.target.value)}
                      >
                        <option value="">{t('traits.addTrait')}</option>
                        {unassignedTraits.map((tr) => (
                          <option key={tr.id} value={tr.id}>
                            {tr.name}
                          </option>
                        ))}
                      </Select>
                      {pendingTraitId && (
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <StarRating
                            value={pendingRating}
                            onChange={setPendingRating}
                            size={22}
                          />
                          <button
                            type="button"
                            onClick={handleAddTrait}
                            className="bg-primary hover:bg-primary-hover text-white px-4 py-1.5 rounded-lg text-sm transition-colors"
                          >
                            {t('traits.confirmAdd')}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </section>
      </div>

      {/* Manage Traits Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={t('traits.managePool')}
      >
        <div className="p-4 flex flex-col gap-5">
          <form
            onSubmit={createForm.handleSubmit(handleCreateTrait)}
            className="bg-background rounded-lg p-3 flex flex-col gap-3"
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
              className="bg-accent hover:bg-accent/80 disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
            >
              {createForm.formState.isSubmitting
                ? t('common.creating')
                : t('traits.createTrait')}
            </button>
          </form>

          <div>
            <h3 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
              {t('traits.allTraits')} ({traits.length})
            </h3>
            {traits.length === 0 ? (
              <p className="text-xs text-muted">{t('traits.noTraits')}</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {traits.map((trait) => (
                  <li
                    key={trait.id}
                    className="flex items-start justify-between gap-2 bg-background rounded-md px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium">{trait.name}</span>
                      {trait.description && (
                        <p className="text-xs text-muted mt-0.5">
                          {trait.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTrait(trait.id)}
                      aria-label={t('common.delete')}
                      className="p-1.5 text-danger hover:bg-danger/20 rounded shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Drawer>
    </div>
  );
}
