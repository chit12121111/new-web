'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguageStore } from '@/store/languageStore';
import Navbar from '@/components/Navbar';
import PricingCard from '@/components/PricingCard';
import { subscriptionsApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticated } = useAuthStore();
  const { locale } = useLanguageStore();
  const [t, setT] = useState<any>({});
  const router = useRouter();

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

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await subscriptionsApi.getPlans();
      const plansData = response.data.map((plan: any) => ({
        ...plan,
        features: JSON.parse(plan.features || '[]'),
      }));
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleSelectPlan = async (planName: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to subscribe');
      router.push('/login');
      return;
    }

    if (planName === 'FREE') {
      toast('You are already on the free plan');
      return;
    }

    setIsLoading(true);
    try {
      const response = await subscriptionsApi.createCheckout(planName);
      window.location.href = response.data.url;
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create checkout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {getText('pricing.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {getText('pricing.subtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              currentPlan={user?.role}
              onSelect={handleSelectPlan}
              isLoading={isLoading}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            {getText('pricing.faq')}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6 text-left">
            <FAQItem
              question={getText('pricing.faq1_q')}
              answer={getText('pricing.faq1_a')}
            />
            <FAQItem
              question={getText('pricing.faq2_q')}
              answer={getText('pricing.faq2_a')}
            />
            <FAQItem
              question={getText('pricing.faq3_q')}
              answer={getText('pricing.faq3_a')}
            />
            <FAQItem
              question={getText('pricing.faq4_q')}
              answer={getText('pricing.faq4_a')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-gray-600">{answer}</p>
    </div>
  );
}

