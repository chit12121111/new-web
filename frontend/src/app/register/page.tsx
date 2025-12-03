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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isTryout: true,
  });
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

  const { register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await register(formData);
      router.push('/login');
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
            {getText('auth.create_account')}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {getText('auth.start_trial')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                label={getText('auth.first_name')}
                placeholder="John"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />

              <Input
                type="text"
                label={getText('auth.last_name')}
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>

            <Input
              type="email"
              label={getText('auth.email')}
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />

            <Input
              type="password"
              label={getText('auth.password')}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="tryout"
                checked={formData.isTryout}
                onChange={(e) =>
                  setFormData({ ...formData, isTryout: e.target.checked })
                }
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="tryout"
                className="ml-2 block text-sm text-gray-700"
              >
                {getText('auth.trial_option')}
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isLoading}
            >
              {getText('auth.create_account')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {getText('auth.already_account')}{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {getText('auth.signin')}
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

