/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '@/components/analytics-gate';
import { BarChart3, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const VERCEL_ANALYTICS_DASHBOARD =
  'https://vercel.com/dashboard/analytics';

export default function AppAnalyticsPage() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEnabled(isAnalyticsEnabled());
    setHydrated(true);
  }, []);

  const handleToggle = () => {
    const next = !enabled;
    setEnabled(next);
    setAnalyticsEnabled(next);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <BarChart3 size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold mb-1">
              {t('appAnalytics.title')}
            </h2>
            <p className="text-sm text-muted">
              {t('appAnalytics.description')}
            </p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label={t('appAnalytics.toggleAria')}
            onClick={handleToggle}
            disabled={!hydrated}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 ${
              enabled ? 'bg-primary' : 'bg-card-hover'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div
          className={`mt-4 px-3 py-2 rounded-md text-xs font-medium ${
            enabled
              ? 'bg-green-500/15 text-green-500'
              : 'bg-slate-500/15 text-muted'
          }`}
        >
          {enabled
            ? t('appAnalytics.statusOn')
            : t('appAnalytics.statusOff')}
        </div>
      </div>

      <div className="bg-card rounded-lg p-6 space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          {t('appAnalytics.dashboardSection')}
        </h3>
        <p className="text-sm text-muted">
          {t('appAnalytics.dashboardHint')}
        </p>
        <a
          href={VERCEL_ANALYTICS_DASHBOARD}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm transition-colors"
        >
          <ExternalLink size={14} />
          {t('appAnalytics.openDashboard')}
        </a>
      </div>

      <div className="bg-card rounded-lg p-4 border-l-4 border-yellow-500/60 text-xs text-muted">
        <p>{t('appAnalytics.privacyNote')}</p>
      </div>
    </div>
  );
}
