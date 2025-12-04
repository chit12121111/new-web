'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Trash2, Key, Eye, EyeOff, Coins, Plus } from 'lucide-react';
import { formatDate, getRoleBadgeColor } from '@/lib/utils';

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUpdatingCredits, setIsUpdatingCredits] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCreditsForm, setShowCreditsForm] = useState(false);
  const [formData, setFormData] = useState({
    role: '',
    newPassword: '',
    confirmPassword: '',
    seoCredits: '',
    reelCredits: '',
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
        seoCredits: userData.seoCredits?.toString() || '0',
        reelCredits: userData.reelCredits?.toString() || '0',
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

  const handleUpdateCredits = async () => {
    const seoCredits = formData.seoCredits ? parseInt(formData.seoCredits) : undefined;
    const reelCredits = formData.reelCredits ? parseInt(formData.reelCredits) : undefined;

    if (seoCredits === undefined && reelCredits === undefined) {
      toast.error('Please enter at least one credit value');
      return;
    }

    if (seoCredits !== undefined && (isNaN(seoCredits) || seoCredits < 0)) {
      toast.error('SEO Credits must be a valid positive number');
      return;
    }

    if (reelCredits !== undefined && (isNaN(reelCredits) || reelCredits < 0)) {
      toast.error('Reel Credits must be a valid positive number');
      return;
    }

    setIsUpdatingCredits(true);
    try {
      await adminApi.updateUserCredits(userId, seoCredits, reelCredits);
      toast.success('Credits updated successfully');
      fetchUser(); // Refresh user data
      setShowCreditsForm(false);
    } catch (error: any) {
      console.error('Failed to update credits:', error);
      toast.error(error?.response?.data?.message || 'Failed to update credits');
    } finally {
      setIsUpdatingCredits(false);
    }
  };

  const handleResetPassword = async () => {
    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!confirm('Are you sure you want to reset this user\'s password?')) {
      return;
    }

    setIsResettingPassword(true);
    try {
      await adminApi.resetUserPassword(userId, formData.newPassword);
      toast.success('Password reset successfully');
      setFormData({ ...formData, newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error: any) {
      console.error('Failed to reset password:', error);
      toast.error(error?.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Credits Management
            </h2>
            {user && (
              <>
                {!showCreditsForm ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setShowCreditsForm(true);
                      setFormData({
                        ...formData,
                        seoCredits: (user.seoCredits || 0).toString(),
                        reelCredits: (user.reelCredits || 0).toString(),
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Update Credits
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreditsForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </>
            )}
          </div>
          {!showCreditsForm ? (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Credits
                </label>
                <p className="text-3xl font-bold text-primary-600">
                  {user?.seoCredits || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reel Credits
                </label>
                <p className="text-3xl font-bold text-primary-600">
                  {user?.reelCredits || 0}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SEO Credits
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.seoCredits}
                  onChange={(e) => setFormData({ ...formData, seoCredits: e.target.value })}
                  placeholder="Enter SEO credits"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {user.seoCredits || 0}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reel Credits
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.reelCredits}
                  onChange={(e) => setFormData({ ...formData, reelCredits: e.target.value })}
                  placeholder="Enter Reel credits"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Current: {user.reelCredits || 0}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  onClick={handleUpdateCredits}
                  isLoading={isUpdatingCredits}
                  className="flex-1"
                >
                  <Coins className="h-4 w-4 mr-2" />
                  Update Credits
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreditsForm(false);
                    setFormData({
                      ...formData,
                      seoCredits: (user.seoCredits || 0).toString(),
                      reelCredits: (user.reelCredits || 0).toString(),
                    });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
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

        {/* Reset Password */}
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Password Management
          </h2>
          <div className="space-y-4">
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Passwords are encrypted and cannot be viewed. You can only reset the password to a new one.
              </p>
            </div>
            
            {!showPasswordForm ? (
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(true)}
                className="w-full"
              >
                <Key className="h-4 w-4 mr-2" />
                Reset Password
              </Button>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Enter new password (min 6 characters)"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleResetPassword}
                    isLoading={isResettingPassword}
                    className="flex-1"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setFormData({ ...formData, newPassword: '', confirmPassword: '' });
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
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

