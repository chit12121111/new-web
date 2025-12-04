'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { formatDate, getRoleBadgeColor } from '@/lib/utils';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
  });

  useEffect(() => {
    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getUserById(userId);
      const userData = response.data;
      setUser(userData);
      setFormData({
        role: userData.role || '',
      });
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch user');
      router.push('/admin/users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!formData.role || formData.role === user?.role) {
      toast.error('Please select a different role');
      return;
    }

    setIsSaving(true);
    try {
      await adminApi.updateUserRole(userId, formData.role);
      toast.success('User role updated successfully');
      fetchUser(); // Refresh user data
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      toast.error(error?.response?.data?.message || 'Failed to update user role');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      toast.success('User deleted successfully');
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Failed to delete user:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">User not found</p>
        <Button
          variant="outline"
          onClick={() => router.push('/admin/users')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
            <p className="text-gray-600 mt-1">
              View and manage user information
            </p>
          </div>
        </div>
        <Button
          variant="danger"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete User
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Information */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <p className="text-gray-900">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <p className="text-gray-900">
                {user.firstName || ''} {user.lastName || ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Role
              </label>
              <Badge className={getRoleBadgeColor(user.role)}>
                {user.role}
              </Badge>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Joined Date
              </label>
              <p className="text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </Card>

        {/* Credits Information */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Credits
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                SEO Credits
              </label>
              <p className="text-2xl font-bold text-primary-600">
                {user.seoCredits || 0}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reel Credits
              </label>
              <p className="text-2xl font-bold text-primary-600">
                {user.reelCredits || 0}
              </p>
            </div>
          </div>
        </Card>

        {/* Update Role */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Update Role
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User Role
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="FREE">FREE</option>
                <option value="TRYOUT">TRYOUT</option>
                <option value="BASIC">BASIC</option>
                <option value="PRO">PRO</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
            <Button
              variant="primary"
              onClick={handleUpdateRole}
              isLoading={isSaving}
              className="w-full"
            >
              <Save className="h-4 w-4 mr-2" />
              Update Role
            </Button>
          </div>
        </Card>

        {/* Subscription Information */}
        {user.subscription && (
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Subscription
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <Badge
                  variant={user.subscription.status === 'ACTIVE' ? 'success' : 'warning'}
                >
                  {user.subscription.status}
                </Badge>
              </div>
              {user.subscription.plan && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan
                  </label>
                  <p className="text-gray-900">{user.subscription.plan.name}</p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Recent Contents */}
        {user.contents && user.contents.length > 0 && (
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Contents ({user.contents.length})
            </h2>
            <div className="space-y-2">
              {user.contents.slice(0, 5).map((content: any) => (
                <div
                  key={content.id}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium text-gray-900">{content.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(content.createdAt)}
                    </p>
                  </div>
                  <Badge>{content.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Payments */}
        {user.payments && user.payments.length > 0 && (
          <Card className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Payments ({user.payments.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {user.payments.slice(0, 5).map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        ${payment.amount}
                      </td>
                      <td className="px-4 py-2">
                        <Badge
                          variant={payment.status === 'succeeded' ? 'success' : 'warning'}
                        >
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

