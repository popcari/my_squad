/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { Analytics } from '@vercel/analytics/next';
import { useEffect, useState } from 'react';

export const ANALYTICS_STORAGE_KEY = 'app_analytics_enabled';

export function isAnalyticsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const raw = window.localStorage.getItem(ANALYTICS_STORAGE_KEY);
  // Default ON: only disabled when explicitly set to "false".
  return raw !== 'false';
}

export function setAnalyticsEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ANALYTICS_STORAGE_KEY, enabled ? 'true' : 'false');
  // Notify other tabs / components in the same tab.
  window.dispatchEvent(new Event('app-analytics-changed'));
}

/**
 * Conditionally renders Vercel Analytics based on the user's opt-in stored
 * in localStorage. Defaults to enabled.
 */
export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    setEnabled(isAnalyticsEnabled());
    const onChange = () => setEnabled(isAnalyticsEnabled());
    window.addEventListener('app-analytics-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('app-analytics-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
