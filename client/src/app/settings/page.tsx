'use client';

import { SettingsPageSkeleton } from '@/components/skeleton';
import { InputText } from '@/components/ui/input-text';
import { useConfirm } from '@/contexts/confirm-context';
import { useCanManage } from '@/hooks/use-can-manage';
import { teamSettingsService } from '@/services/team-settings.service';
import type { TeamSettings } from '@/types/team-settings';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const canManage = useCanManage();
  const confirm = useConfirm();
  const [settings, setSettings] = useState<TeamSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    foundedDate: '',
    logo: '',
    homeStadium: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await teamSettingsService.get();
    setSettings(data);
    setForm({
      name: data.name || '',
      description: data.description || '',
      foundedDate: data.foundedDate || '',
      logo: data.logo || '',
      homeStadium: data.homeStadium || '',
    });
    setLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const data = await teamSettingsService.get();
      setSettings(data);
      setForm({
        name: data.name || '',
        description: data.description || '',
        foundedDate: data.foundedDate || '',
        logo: data.logo || '',
        homeStadium: data.homeStadium || '',
      });
      setLoading(false);
    };
    init();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await confirm({
      title: 'Save Settings',
      message: 'Save changes to team settings?',
      confirmText: 'Save',
    });
    if (!ok) return;
    setSaving(true);
    await teamSettingsService.update(form);
    setEditing(false);
    await load();
    setSaving(false);
  };

  if (loading) return <SettingsPageSkeleton />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Team Settings</h1>
        {canManage && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <form
          onSubmit={handleSave}
          className="bg-card rounded-lg p-6 space-y-4 max-w-2xl"
        >
          <InputText
            label="Team Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
              className="w-full bg-background border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputText
              label="Founded Date"
              type="date"
              value={form.foundedDate}
              onChange={(e) =>
                setForm({ ...form, foundedDate: e.target.value })
              }
            />
            <InputText
              label="Home Stadium"
              value={form.homeStadium}
              onChange={(e) =>
                setForm({ ...form, homeStadium: e.target.value })
              }
              placeholder="Stadium name"
            />
          </div>
          <InputText
            label="Logo URL"
            value={form.logo}
            onChange={(e) => setForm({ ...form, logo: e.target.value })}
            placeholder="https://..."
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-sm transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="px-6 py-2 bg-card-hover hover:bg-border text-foreground rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          {/* Team card */}
          <div className="bg-card rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              {settings?.logo ? (
                <Image
                  src={settings.logo}
                  alt="Team logo"
                  width={64}
                  height={64}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl">
                  ⚽
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold">
                  {settings?.name || 'My Squad'}
                </h2>
                {settings?.description && (
                  <p className="text-sm text-muted mt-1">
                    {settings.description}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-primary">
                  {settings?.playerCount ?? 0}
                </div>
                <div className="text-xs text-muted mt-1">Players</div>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-sm font-medium">
                  {settings?.foundedDate
                    ? new Date(settings.foundedDate).toLocaleDateString('vi-VN')
                    : '-'}
                </div>
                <div className="text-xs text-muted mt-1">Founded</div>
              </div>
              <div className="bg-background rounded-lg p-4 text-center">
                <div className="text-sm font-medium truncate">
                  {settings?.homeStadium || '-'}
                </div>
                <div className="text-xs text-muted mt-1">Home Stadium</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
