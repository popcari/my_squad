'use client';

import { changeLanguage } from '@/i18n';
import Image from 'next/image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'EN', flag: 'https://flagcdn.com/w20/gb.png' },
  { code: 'vi', label: 'VI', flag: 'https://flagcdn.com/w20/vn.png' },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current =
    languages.find((l) => l.code === i18n.language) || languages[0];

  const handleSelect = (code: string) => {
    changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-card-hover text-lg transition-colors"
        aria-label="Change language"
      >
        <span className="flex items-center">
          <Image
            src={current.flag}
            alt={current.label}
            width={20}
            height={15}
            className="rounded-[2px]"
          />
        </span>
        <span className="text-xs font-medium hidden sm:inline">
          {current.label}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[100px]">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-card-hover ${
                  lang.code === i18n.language
                    ? 'text-primary font-medium'
                    : 'text-foreground'
                }`}
              >
                <span className="flex items-center">
                  <Image
                    src={lang.flag}
                    alt={lang.label}
                    width={20}
                    height={15}
                    className="rounded-[2px]"
                  />
                </span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
