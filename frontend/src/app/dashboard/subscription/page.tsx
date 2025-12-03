'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { subscriptionsApi, paymentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { CreditCard, Calendar, TrendingUp } from 'lucide-react';
import { formatDate, formatCurrency, getRoleBadgeColor } from '@/lib/utils';
import Link from 'next/link';

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const { locale } = useLanguageStore();
  const [subscription, setSubscription] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../../../messages/${locale}.json`).then((msgs) => {
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

  useEffect(() => {
    fetchSubscription();
    fetchPayments();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await subscriptionsApi.getMySubscription();
      setSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await paymentsApi.getHistory();
      setPayments(response.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
    }
  };

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const response = await subscriptionsApi.createPortal();
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to open billing portal');
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    setIsLoading(true);
    try {
      await subscriptionsApi.cancel();
      toast.success('Subscription will be cancelled at period end');
      fetchSubscription();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getText('subscription.title')}</h1>
        <p className="text-gray-600 mt-1">
          {getText('subscription.subtitle')}
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{getText('subscription.current_plan')}</h2>
          <Badge className={getRoleBadgeColor(user?.role || '')}>
            {user?.role}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">{getText('generate.seo_articles')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.seoCredits || 0}
              </p>
              <p className="text-xs text-gray-500">{getText('subscription.credits_remaining')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{getText('generate.reel_scripts')}</p>
              <p className="text-2xl font-bold text-gray-900">
                {user?.reelCredits || 0}
              </p>
              <p className="text-xs text-gray-500">{getText('subscription.credits_remaining')}</p>
            </div>
          </div>

          {subscription && subscription.currentPeriodEnd && (
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="h-4 w-4 mr-2" />
              <span>
                {subscription.cancelAtPeriodEnd ? getText('subscription.expires') : getText('subscription.renews')} {formatDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            {user?.role !== 'FREE' && user?.role !== 'TRYOUT' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleManageBilling}
                  isLoading={isLoading}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {getText('subscription.manage_billing')}
                </Button>
                {!subscription?.cancelAtPeriodEnd && (
                  <Button
                    variant="danger"
                    onClick={handleCancelSubscription}
                    isLoading={isLoading}
                  >
                    {getText('subscription.cancel_subscription')}
                  </Button>
                )}
              </>
            )}
            <Link href="/pricing">
              <Button variant="primary">
                <TrendingUp className="h-4 w-4 mr-2" />
                {user?.role === 'FREE' || user?.role === 'TRYOUT'
                  ? getText('dashboard.view_plans')
                  : getText('subscription.upgrade_plan')}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {getText('subscription.payment_history')}
          </h2>
          <div className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="py-4 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {payment.description || 'Subscription Payment'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(payment.amount, payment.currency)}
                  </p>
                  <Badge
                    variant={
                      payment.status === 'succeeded' ? 'success' : 'warning'
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

