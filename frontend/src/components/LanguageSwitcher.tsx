'use client';

import { useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { locales, localeNames, localeFlags, type Locale } from '@/lib/i18n-config';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale);
    setIsOpen(false);
    // Reload to apply new language
    window.location.reload();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <Globe className="h-5 w-5 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {localeFlags[locale]} {localeNames[locale]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
            {locales.map((loc) => (
              <button
                key={loc}
                onClick={() => handleChange(loc)}
                className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                  locale === loc ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                }`}
              >
                <span className="text-xl">{localeFlags[loc]}</span>
                <span className="text-sm font-medium">{localeNames[loc]}</span>
                {locale === loc && (
                  <span className="ml-auto text-primary-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

