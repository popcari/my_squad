'use client';

import { Drawer } from '@/components/drawer';
import { FootballPitch, type UniformColors } from '@/components/football-pitch';
import { InputText } from '@/components/ui/input-text';
import { UniformVisual } from '@/components/uniform-visual';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  type CreateFormationPayload,
  formationsService,
} from '@/services/formations.service';
import { uniformsService } from '@/services/uniforms.service';
import type { Formation, FormationSlot } from '@/types/formation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DrawerState =
  | { mode: 'create' }
  | { mode: 'edit'; formation: Formation }
  | null;

const DEFAULT_SLOTS: FormationSlot[] = [
  { role: 'GK', x: 50, y: 10 },
  { role: 'LB', x: 20, y: 35 },
  { role: 'CB', x: 50, y: 30 },
  { role: 'RB', x: 80, y: 35 },
  { role: 'LM', x: 25, y: 65 },
  { role: 'RM', x: 75, y: 65 },
  { role: 'ST', x: 50, y: 88 },
];

export default function FormationsPage() {
  const { t } = useTranslation();
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [formations, setFormations] = useState<Formation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawerState, setDrawerState] = useState<DrawerState>(null);
  const [latestUniform, setLatestUniform] = useState<UniformColors | undefined>(
    undefined,
  );

  useEffect(() => {
    const load = async () => {
      const [formationData, uniformData] = await Promise.all([
        formationsService.getAll(),
        uniformsService.getAll(),
      ]);
      setFormations(formationData);
      if (uniformData.length > 0) {
        const latest = uniformData.reduce((a, b) => (b.year >= a.year ? b : a));
        setLatestUniform({
          shirtColor: latest.shirtColor,
          pantColor: latest.pantColor,
          numberColor: latest.numberColor,
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  const reload = async () => {
    const data = await formationsService.getAll();
    setFormations(data);
  };

  const handleCreate = async (values: CreateFormationPayload) => {
    setSaving(true);
    try {
      await formationsService.create(values);
      setDrawerState(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, values: CreateFormationPayload) => {
    setSaving(true);
    try {
      await formationsService.update(id, values);
      setDrawerState(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: Formation) => {
    const ok = await confirm({
      title: t('formations.deleteTitle'),
      message: t('formations.deleteMessage', { name: f.name }),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await formationsService.remove(f.id);
    await reload();
  };

  if (loading) return <p className="text-muted">{t('formations.loading')}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">{t('formations.title')}</h1>
        {canManage && (
          <button
            onClick={() => setDrawerState({ mode: 'create' })}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
          >
            {t('formations.addFormation')}
          </button>
        )}
      </div>

      {formations.length === 0 ? (
        <p className="text-muted">{t('formations.noFormations')}</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {formations.map((f) => (
            <div
              key={f.id}
              className="bg-card rounded-lg overflow-hidden group relative"
            >
              <FootballPitch
                slots={f.slots}
                uniform={latestUniform}
                className="pointer-events-none"
              />
              <div className="p-3">
                <p className="text-sm font-medium">{f.name}</p>
                <p className="text-xs text-muted">
                  {t('formations.players', { count: f.slots.length })}
                </p>
              </div>
              {canManage && (
                <div className="absolute top-2 right-2 flex gap-1 transition-all">
                  <button
                    type="button"
                    onClick={() =>
                      setDrawerState({ mode: 'edit', formation: f })
                    }
                    aria-label={t('formations.editAria', { name: f.name })}
                    className="w-7 h-7 rounded-full bg-black/70 text-white text-xs hover:bg-primary flex items-center justify-center"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(f)}
                    aria-label={t('formations.deleteAria', { name: f.name })}
                    className="w-7 h-7 rounded-full bg-black/70 text-white text-xs hover:bg-danger flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerState !== null}
        onClose={() => setDrawerState(null)}
        title={
          drawerState?.mode === 'edit'
            ? t('formations.editFormation')
            : t('formations.addFormationPlain')
        }
      >
        {drawerState && (
          <FormationForm
            key={
              drawerState.mode === 'edit' ? drawerState.formation.id : 'create'
            }
            initial={
              drawerState.mode === 'edit' ? drawerState.formation : undefined
            }
            saving={saving}
            submitLabel={
              drawerState.mode === 'edit'
                ? t('formations.saveChanges')
                : t('formations.create')
            }
            uniform={latestUniform}
            onSubmit={(values) =>
              drawerState.mode === 'edit'
                ? handleUpdate(drawerState.formation.id, values)
                : handleCreate(values)
            }
            onCancel={() => setDrawerState(null)}
          />
        )}
      </Drawer>
    </div>
  );
}

function FormationForm({
  initial,
  saving,
  submitLabel,
  uniform,
  onSubmit,
  onCancel,
}: {
  initial?: Formation;
  saving: boolean;
  submitLabel: string;
  uniform?: UniformColors;
  onSubmit: (values: CreateFormationPayload) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initial?.name ?? '');
  const [slots, setSlots] = useState<FormationSlot[]>(
    initial ? [...initial.slots] : [...DEFAULT_SLOTS],
  );
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeSlot === null) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    // Pitch renders flipped (y=0 at bottom); invert from screen coords.
    const y = 100 - ((e.clientY - rect.top) / rect.height) * 100;
    setSlots((prev) =>
      prev.map((s, i) =>
        i === activeSlot ? { ...s, x: Math.round(x), y: Math.round(y) } : s,
      ),
    );
    setActiveSlot(null);
  };

  const handleRoleChange = (idx: number, role: string) => {
    setSlots((prev) => prev.map((s, i) => (i === idx ? { ...s, role } : s)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name: name.trim(), slots });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <InputText
        id="formation-name"
        label={t('formations.nameLabel')}
        placeholder={t('formations.namePlaceholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div>
        <p className="text-sm font-medium mb-2">
          {t('formations.pitchLayout')}{' '}
          {activeSlot !== null && (
            <span className="text-xs text-primary">
              {t('formations.clickToPlace', { role: slots[activeSlot].role })}
            </span>
          )}
        </p>
        <div onClick={handlePitchClick}>
          <FootballPitch
            slots={slots}
            renderSlot={(slot, i) => (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveSlot(i);
                }}
                className={`flex flex-col items-center gap-0.5 transition-all ${
                  activeSlot === i
                    ? 'scale-125 drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]'
                    : 'hover:scale-110'
                }`}
                aria-label={t('formations.slotAria', {
                  index: i + 1,
                  role: slot.role,
                })}
              >
                {uniform ? (
                  <>
                    <UniformVisual
                      shirtColor={uniform.shirtColor}
                      pantColor={uniform.pantColor}
                      numberColor={uniform.numberColor}
                      className={`w-12 h-15 drop-shadow-md ${
                        activeSlot === i ? 'animate-pulse' : ''
                      }`}
                    />
                    <span
                      className={`text-[12px] md:text-[14px] font-bold leading-none ${
                        activeSlot === i ? 'text-yellow-300' : 'text-white'
                      }`}
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
                    >
                      {slot.role}
                    </span>
                  </>
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full text-xs font-bold flex items-center justify-center border-2 shadow-lg ${
                      activeSlot === i
                        ? 'bg-primary text-white border-primary animate-pulse'
                        : 'bg-white/90 text-green-800 border-white hover:bg-primary hover:text-white'
                    }`}
                  >
                    {slot.role}
                  </div>
                )}
              </button>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot, i) => (
          <div key={i} className="flex items-center gap-2">
            {/* <span className="text-xs text-muted w-6">#{i + 1}</span> */}
            <input
              type="text"
              value={slot.role}
              onChange={(e) => handleRoleChange(i, e.target.value)}
              className="flex-1 bg-background border border-border rounded px-2 py-1 text-xs font-mono"
              aria-label={t('formations.roleForSlot', { index: i + 1 })}
            />
            {/* <span className="text-[10px] text-muted font-mono">
              {slot.x},{slot.y}
            </span> */}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-card-hover hover:bg-border text-foreground py-2 rounded-lg text-sm transition-colors"
        >
          {t('formations.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? t('formations.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}
