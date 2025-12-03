'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { contentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { Sparkles, FileText, Video, CreditCard } from 'lucide-react';
import { getRoleBadgeColor, formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { locale } = useLanguageStore();
  const [stats, setStats] = useState<any>(null);
  const [recentContents, setRecentContents] = useState<any[]>([]);
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

  useEffect(() => {
    fetchStats();
    fetchRecentContents();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await contentsApi.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentContents = async () => {
    try {
      const response = await contentsApi.getAll();
      // Ensure response.data is an array
      const contents = Array.isArray(response.data) ? response.data : [];
      setRecentContents(contents.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch contents:', error);
      // Set empty array on error
      setRecentContents([]);
    }
  };

  const getTryoutDaysRemaining = () => {
    if (user?.tryoutEndDate) {
      const endDate = new Date(user.tryoutEndDate);
      const today = new Date();
      const diffTime = endDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getText('dashboard.title')}</h1>
        <p className="text-gray-600 mt-1">
          {getText('dashboard.welcome')}, {user?.firstName || user?.email}!
        </p>
      </div>

      {/* Try-out Banner */}
      {user?.role === 'TRYOUT' && (
        <Card className="bg-yellow-50 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-yellow-900">
                {getText('dashboard.trial_remaining').replace('{days}', getTryoutDaysRemaining().toString())}
              </h3>
              <p className="text-yellow-700 mt-1">
                {getTryoutDaysRemaining()} {getText('dashboard.trial_remaining')}
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="primary">{getText('dashboard.upgrade_now')}</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Free Plan Banner */}
      {user?.role === 'FREE' && (
        <Card className="bg-blue-50 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                {getText('dashboard.upgrade_unlock')}
              </h3>
              <p className="text-blue-700 mt-1">
                {getText('dashboard.upgrade_unlock')}
              </p>
            </div>
            <Link href="/pricing">
              <Button variant="primary">{getText('dashboard.view_plans')}</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Sparkles className="h-8 w-8 text-primary-600" />}
          title={getText('dashboard.plan')}
          value={user?.role || 'N/A'}
          badge={
            <Badge className={getRoleBadgeColor(user?.role || '')}>
              {user?.role}
            </Badge>
          }
        />
        <StatCard
          icon={<FileText className="h-8 w-8 text-green-600" />}
          title={getText('dashboard.seo_credits')}
          value={user?.seoCredits || 0}
        />
        <StatCard
          icon={<Video className="h-8 w-8 text-purple-600" />}
          title={getText('dashboard.reel_credits')}
          value={user?.reelCredits || 0}
        />
        <StatCard
          icon={<CreditCard className="h-8 w-8 text-blue-600" />}
          title={getText('dashboard.total_contents')}
          value={stats?.totalContents || 0}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {getText('dashboard.quick_actions')}
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Link href="/dashboard/generate">
            <Card hover className="cursor-pointer">
              <div className="flex items-center">
                <Sparkles className="h-10 w-10 text-primary-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getText('dashboard.generate_content')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getText('dashboard.create_now')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/library">
            <Card hover className="cursor-pointer">
              <div className="flex items-center">
                <FileText className="h-10 w-10 text-green-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getText('dashboard.content_library')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getText('dashboard.view_contents')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/dashboard/subscription">
            <Card hover className="cursor-pointer">
              <div className="flex items-center">
                <CreditCard className="h-10 w-10 text-blue-600 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {getText('dashboard.manage_subscription')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {getText('dashboard.update_plan')}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* Recent Contents */}
      {Array.isArray(recentContents) && recentContents.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {getText('dashboard.recent_contents')}
            </h2>
            <Link href="/dashboard/library">
              <Button variant="ghost" size="sm">
                {getText('dashboard.view_all')}
              </Button>
            </Link>
          </div>
          <Card>
            <div className="divide-y divide-gray-200">
              {recentContents.map((content) => (
                <div
                  key={content.id}
                  className="py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">
                        {content.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(content.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        content.type === 'SEO_ARTICLE' ? 'success' : 'info'
                      }
                    >
                      {content.type === 'SEO_ARTICLE' ? getText('content_types.seo') : getText('content_types.reel')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  badge?: React.ReactNode;
}) {
  return (
    <Card>
      <div className="flex items-center">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-center mt-1">
            {badge || (
              <p className="text-2xl font-semibold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

