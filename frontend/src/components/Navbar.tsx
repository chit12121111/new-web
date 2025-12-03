'use client';

import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, Settings, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import Button from './ui/Button';
import Badge from './ui/Badge';
import LanguageSwitcher from './LanguageSwitcher';
import { getRoleBadgeColor } from '@/lib/utils';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { locale } = useLanguageStore();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [translations, setTranslations] = useState<any>({});

  useEffect(() => {
    import(`../../messages/${locale}.json`).then((msgs) => {
      setTranslations(msgs.default);
    });
  }, [locale]);

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary-600">
                AI Content Pro
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSwitcher />
            
            <Link
              href="/pricing"
              className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              {t('nav.pricing')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('nav.dashboard')}
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    {t('nav.admin')}
                  </Link>
                )}

                <div className="flex items-center space-x-2">
                  <Badge className={getRoleBadgeColor(user?.role || '')}>
                    {user?.role}
                  </Badge>
                  <span className="text-sm text-gray-700">
                    {user?.email}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    {t('nav.signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            
            <Link
              href="/pricing"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
            >
              {t('nav.pricing')}
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  {t('nav.dashboard')}
                </Link>

                {user?.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  >
                    {t('nav.admin')}
                  </Link>
                )}

                <div className="px-3 py-2">
                  <Badge className={getRoleBadgeColor(user?.role || '')}>
                    {user?.role}
                  </Badge>
                  <p className="text-sm text-gray-700 mt-1">{user?.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                >
                  {t('nav.signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

