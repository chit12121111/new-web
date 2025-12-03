'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import Navbar from '@/components/Navbar';
import Button from '@/components/ui/Button';
import { Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';

export default function Home() {
  const { locale } = useLanguageStore();
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../messages/${locale}.json`).then((msgs) => {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {getText('home.hero_title')}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {getText('home.hero_subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                {getText('home.start_trial')}
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {getText('home.view_pricing')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          {getText('home.why_choose')}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<Sparkles className="h-8 w-8 text-primary-600" />}
            title={getText('home.feature1_title')}
            description={getText('home.feature1_desc')}
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8 text-primary-600" />}
            title={getText('home.feature2_title')}
            description={getText('home.feature2_desc')}
          />
          <FeatureCard
            icon={<Shield className="h-8 w-8 text-primary-600" />}
            title={getText('home.feature3_title')}
            description={getText('home.feature3_desc')}
          />
          <FeatureCard
            icon={<TrendingUp className="h-8 w-8 text-primary-600" />}
            title={getText('home.feature4_title')}
            description={getText('home.feature4_desc')}
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {getText('home.how_it_works')}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title={getText('home.step1_title')}
              description={getText('home.step1_desc')}
            />
            <StepCard
              number="2"
              title={getText('home.step2_title')}
              description={getText('home.step2_desc')}
            />
            <StepCard
              number="3"
              title={getText('home.step3_title')}
              description={getText('home.step3_desc')}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-primary-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {getText('home.cta_title')}
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            {getText('home.cta_subtitle')}
          </p>
          <Link href="/register">
            <Button
              variant="secondary"
              size="lg"
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              {getText('home.get_started')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-400">
            © 2024 AI Content Pro. {getText('home.footer_rights')}.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

