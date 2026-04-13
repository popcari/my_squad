'use client';

import { Drawer } from '@/components/drawer';
import { InputText } from '@/components/ui/input-text';
import { Select } from '@/components/ui/select';
import { UniformVisual } from '@/components/uniform-visual';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import {
  type CreateUniformPayload,
  uniformsService,
} from '@/services/uniforms.service';
import type { TeamUniform } from '@/types/team-uniform';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

type DrawerState =
  | { mode: 'create' }
  | { mode: 'edit'; uniform: TeamUniform }
  | null;

const DEFAULT_VALUES: CreateUniformPayload = {
  year: new Date().getFullYear(),
  name: '',
  shirtColor: '#e11d48',
  pantColor: '#111827',
  numberColor: '#ffffff',
};

export default function UniformsPage() {
  const { t } = useTranslation();
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [uniforms, setUniforms] = useState<TeamUniform[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [yearFilter, setYearFilter] = useState<'all' | number>('all');
  const [drawerState, setDrawerState] = useState<DrawerState>(null);

  useEffect(() => {
    const load = async () => {
      const data = await uniformsService.getAll();
      setUniforms(data);
      setLoading(false);
    };
    load();
  }, []);

  const reload = async () => {
    const data = await uniformsService.getAll();
    setUniforms(data);
  };

  const availableYears = useMemo(
    () =>
      Array.from(new Set(uniforms.map((u) => u.year))).sort((a, b) => b - a),
    [uniforms],
  );

  const grouped = useMemo(() => {
    const filtered =
      yearFilter === 'all'
        ? uniforms
        : uniforms.filter((u) => u.year === yearFilter);
    const groups: Record<number, TeamUniform[]> = {};
    for (const u of filtered) {
      if (!groups[u.year]) groups[u.year] = [];
      groups[u.year].push(u);
    }
    return Object.entries(groups)
      .map(([y, items]) => ({ year: Number(y), items }))
      .sort((a, b) => b.year - a.year);
  }, [uniforms, yearFilter]);

  const handleCreate = async (values: CreateUniformPayload) => {
    const ok = await confirm({
      title: t('uniforms.confirmAddTitle'),
      message: t('uniforms.confirmAddMessage', {
        name: values.name,
        year: values.year,
      }),
      confirmText: t('uniforms.confirmAddAction'),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await uniformsService.create(values);
      setDrawerState(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, values: CreateUniformPayload) => {
    const ok = await confirm({
      title: t('uniforms.confirmSaveTitle'),
      message: t('uniforms.confirmSaveMessage', { name: values.name }),
      confirmText: t('common.save'),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await uniformsService.update(id, values);
      setDrawerState(null);
      await reload();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: t('uniforms.confirmDeleteTitle'),
      message: t('uniforms.confirmDeleteMessage', { name }),
      confirmText: t('common.delete'),
      danger: true,
    });
    if (!ok) return;
    await uniformsService.remove(id);
    await reload();
  };

  if (loading) return <p className="text-muted">{t('uniforms.loading')}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold">{t('uniforms.title')}</h2>
          {availableYears.length > 0 && (
            <div className="w-40">
              <Select
                value={yearFilter}
                onChange={(e) =>
                  setYearFilter(
                    e.target.value === 'all' ? 'all' : Number(e.target.value),
                  )
                }
                aria-label={t('uniforms.filterByYear')}
              >
                <option value="all">{t('uniforms.allYears')}</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => setDrawerState({ mode: 'create' })}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
          >
            {t('uniforms.addUniform')}
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <p className="text-muted">{t('uniforms.noUniforms')}</p>
      ) : (
        <div className="space-y-8">
          {grouped.map((group) => (
            <div key={group.year}>
              <h3 className="text-sm font-semibold text-muted uppercase tracking-wider mb-3">
                {t('uniforms.season', { year: group.year })}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {group.items.map((u) => (
                  <div
                    key={u.id}
                    className="bg-card rounded-lg overflow-hidden group relative"
                  >
                    <div className="aspect-square bg-background flex items-center justify-center p-4">
                      <UniformVisual
                        shirtColor={u.shirtColor}
                        pantColor={u.pantColor}
                        numberColor={u.numberColor}
                        className="w-full h-full"
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted">{u.year}</p>
                    </div>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setDrawerState({ mode: 'edit', uniform: u })
                          }
                          aria-label={t('uniforms.editAria', { name: u.name })}
                          title={t('uniforms.editTooltip')}
                          className="absolute top-2 right-10 w-7 h-7 rounded-full bg-black/70 text-white text-xs hover:bg-primary transition-all flex items-center justify-center"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(u.id, u.name)}
                          aria-label={t('uniforms.deleteAria', {
                            name: u.name,
                          })}
                          title={t('uniforms.deleteTooltip')}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white text-xs hover:bg-danger transition-all flex items-center justify-center"
                        >
                          ×
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Drawer
        open={drawerState !== null}
        onClose={() => setDrawerState(null)}
        title={
          drawerState?.mode === 'edit'
            ? t('uniforms.editUniform')
            : t('uniforms.addUniformPlain')
        }
      >
        {drawerState && (
          <UniformForm
            key={
              drawerState.mode === 'edit' ? drawerState.uniform.id : 'create'
            }
            initial={
              drawerState.mode === 'edit' ? drawerState.uniform : undefined
            }
            submitLabel={
              drawerState.mode === 'edit'
                ? t('uniforms.saveChanges')
                : t('uniforms.addUniformPlain')
            }
            saving={saving}
            onSubmit={(values) =>
              drawerState.mode === 'edit'
                ? handleUpdate(drawerState.uniform.id, values)
                : handleCreate(values)
            }
            onCancel={() => setDrawerState(null)}
          />
        )}
      </Drawer>
    </div>
  );
}

function UniformForm({
  initial,
  submitLabel,
  saving,
  onSubmit,
  onCancel,
}: {
  initial?: TeamUniform;
  submitLabel: string;
  saving: boolean;
  onSubmit: (values: CreateUniformPayload) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [values, setValues] = useState<CreateUniformPayload>(() =>
    initial
      ? {
          year: initial.year,
          name: initial.name,
          shirtColor: initial.shirtColor,
          pantColor: initial.pantColor,
          numberColor: initial.numberColor,
        }
      : DEFAULT_VALUES,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="flex items-center justify-center bg-background rounded-lg p-4">
        <UniformVisual
          shirtColor={values.shirtColor}
          pantColor={values.pantColor}
          numberColor={values.numberColor}
          className="w-36"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <InputText
          id="uniform-year"
          label={t('common.year')}
          type="number"
          min={1900}
          max={3000}
          value={values.year}
          onChange={(e) =>
            setValues({ ...values, year: Number(e.target.value) })
          }
          required
        />
        <InputText
          id="uniform-name"
          label={t('uniforms.nameLabel')}
          placeholder={t('uniforms.namePlaceholder')}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
        />
      </div>

      <ColorField
        id="uniform-shirt-color"
        label={t('uniforms.shirtColor')}
        value={values.shirtColor}
        onChange={(v) => setValues({ ...values, shirtColor: v })}
      />
      <ColorField
        id="uniform-pant-color"
        label={t('uniforms.pantColor')}
        value={values.pantColor}
        onChange={(v) => setValues({ ...values, pantColor: v })}
      />
      <ColorField
        id="uniform-number-color"
        label={t('uniforms.numberColor')}
        value={values.numberColor}
        onChange={(v) => setValues({ ...values, numberColor: v })}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-card-hover hover:bg-border text-foreground py-2 rounded-lg text-sm transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white py-2 rounded-lg text-sm transition-colors"
        >
          {saving ? t('common.saving') : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div
          className="relative h-8 w-8 rounded-full cursor-pointer overflow-hidden border border-border shrink-0"
          style={{ backgroundColor: value }}
        >
          <InputText
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
        <InputText
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-background border border-border rounded px-3 py-2 text-sm font-mono"
          pattern="^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$"
          aria-label={t('uniforms.hexLabel', { label })}
        />
      </div>
    </div>
  );
}
