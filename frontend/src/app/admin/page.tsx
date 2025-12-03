'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate, getRoleBadgeColor } from '@/lib/utils';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your platform statistics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users className="h-8 w-8 text-blue-600" />}
          title="Total Users"
          value={stats?.totalUsers || 0}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<TrendingUp className="h-8 w-8 text-green-600" />}
          title="Active Subscriptions"
          value={stats?.activeSubscriptions || 0}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<DollarSign className="h-8 w-8 text-purple-600" />}
          title="Total Revenue"
          value={formatCurrency(stats?.totalRevenue || 0)}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<FileText className="h-8 w-8 text-orange-600" />}
          title="Total Contents"
          value={stats?.totalContents || 0}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Users by Role */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Users by Role
        </h2>
        <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
          {stats?.usersByRole?.map((item: any) => (
            <div key={item.role} className="text-center">
              <Badge className={getRoleBadgeColor(item.role)}>
                {item.role}
              </Badge>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {item._count}
              </p>
              <p className="text-sm text-gray-600">users</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Recent Users */}
      {stats?.recentUsers && stats.recentUsers.length > 0 && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recent Users
          </h2>
          <div className="divide-y divide-gray-200">
            {stats.recentUsers.map((user: any) => (
              <div
                key={user.id}
                className="py-4 flex items-center justify-between first:pt-0 last:pb-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-sm text-gray-600">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div className="text-right">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role}
                  </Badge>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
}) {
  return (
    <Card>
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-lg ${bgColor}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

