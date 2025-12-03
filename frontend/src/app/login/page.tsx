'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import Navbar from '@/components/Navbar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { locale } = useLanguageStore();
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../../messages/${locale}.json`).then((msgs) => {
      setT(msgs.default);
    });
  }, [locale]);

  const getText = (key: string) => {
    const keys = key.split('.');
    let value = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const { login } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (error) {
      // Error is handled by the store with toast
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-md mx-auto px-4 py-16">
        <Card>
          <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
            {getText('auth.welcome_back')}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {getText('auth.sign_in')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label={getText('auth.email')}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              type="password"
              label={getText('auth.password')}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {getText('auth.login')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {getText('auth.no_account')}{' '}
              <Link
                href="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {getText('auth.signup')}
              </Link>
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              {locale === 'th' ? 'บัญชีทดสอบ (รหัสผ่าน: password123)' : 'Test Accounts (password: password123)'}
              <br />
              Admin: admin@example.com
              <br />
              Try-out: tryout@example.com
              <br />
              Basic: basic@example.com
              <br />
              Pro: pro@example.com
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

