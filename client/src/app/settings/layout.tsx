'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();
  const pathname = usePathname();

  const tabs = [
    { href: '/settings', labelKey: 'layout.teamInfo' },
    { href: '/settings/uniforms', labelKey: 'layout.uniforms' },
    { href: '/settings/app-analytics', labelKey: 'layout.appAnalytics' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('nav.settings')}</h1>

      <nav className="flex gap-1 border-b border-border mb-6">
        {tabs.map((tab) => {
          const isActive =
            tab.href === '/settings'
              ? pathname === '/settings'
              : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {t(tab.labelKey)}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
