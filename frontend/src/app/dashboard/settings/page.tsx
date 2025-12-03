'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { User, Shield, Bell, Key, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { getRoleBadgeColor } from '@/lib/utils';
import { usersApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { locale } = useLanguageStore();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  const [t, setT] = useState<any>({});
  
  // API Key states
  const [apiKeys, setApiKeys] = useState<{
    googleGemini: { hasKey: boolean; maskedKey: string | null };
    openai: { hasKey: boolean; maskedKey: string | null };
    huggingface: { hasKey: boolean; maskedKey: string | null };
  } | null>(null);
  const [apiKeyInputs, setApiKeyInputs] = useState({
    google_gemini: '',
    openai: '',
    huggingface: '',
  });
  const [verifying, setVerifying] = useState({
    google_gemini: false,
    openai: false,
    huggingface: false,
  });
  const [verifyResults, setVerifyResults] = useState<{
    google_gemini: { valid: boolean; message?: string; error?: string; availableModels?: string[] } | null;
    openai: { valid: boolean; message?: string; error?: string; availableModels?: string[] } | null;
    huggingface: { valid: boolean; message?: string; error?: string; availableModels?: string[] } | null;
  }>({
    google_gemini: null,
    openai: null,
    huggingface: null,
  });
  const [saving, setSaving] = useState({
    google_gemini: false,
    openai: false,
    huggingface: false,
  });
  const [deleting, setDeleting] = useState({
    google_gemini: false,
    openai: false,
    huggingface: false,
  });

  useEffect(() => {
    import(`../../../../messages/${locale}.json`).then((msgs) => {
      setT(msgs.default);
    });
  }, [locale]);

  useEffect(() => {
    loadApiKeys();
  }, []);

  const loadApiKeys = async () => {
    try {
      const response = await usersApi.getApiKeys();
      setApiKeys(response.data);
    } catch (error: any) {
      console.error('Failed to load API keys:', error);
    }
  };

  const handleVerifyApiKey = async (type: 'google_gemini' | 'openai' | 'huggingface') => {
    const apiKey = apiKeyInputs[type];
    if (!apiKey || !apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setVerifying({ ...verifying, [type]: true });
    setVerifyResults({ ...verifyResults, [type]: null });

    try {
      const response = await usersApi.verifyApiKey(type, apiKey);
      const result = response.data;
      setVerifyResults({ ...verifyResults, [type]: result });

      if (result.valid) {
        toast.success(result.message || 'API key is valid!');
      } else {
        toast.error(result.error || 'API key verification failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to verify API key';
      setVerifyResults({
        ...verifyResults,
        [type]: { valid: false, error: errorMessage },
      });
      toast.error(errorMessage);
    } finally {
      setVerifying({ ...verifying, [type]: false });
    }
  };

  const handleSaveApiKey = async (type: 'google_gemini' | 'openai' | 'huggingface') => {
    const apiKey = apiKeyInputs[type];
    if (!apiKey || !apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setSaving({ ...saving, [type]: true });

    try {
      await usersApi.saveApiKey(type, apiKey);
      toast.success('API key saved successfully!');
      setApiKeyInputs({ ...apiKeyInputs, [type]: '' });
      await loadApiKeys();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to save API key';
      toast.error(errorMessage);
    } finally {
      setSaving({ ...saving, [type]: false });
    }
  };

  const handleDeleteApiKey = async (type: 'google_gemini' | 'openai' | 'huggingface') => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    setDeleting({ ...deleting, [type]: true });

    try {
      await usersApi.deleteApiKey(type);
      toast.success('API key deleted successfully!');
      setApiKeyInputs({ ...apiKeyInputs, [type]: '' });
      setVerifyResults({ ...verifyResults, [type]: null });
      await loadApiKeys();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to delete API key';
      toast.error(errorMessage);
    } finally {
      setDeleting({ ...deleting, [type]: false });
    }
  };

  const getText = (key: string) => {
    const keys = key.split('.');
    let value = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getText('common.settings')}</h1>
        <p className="text-gray-600 mt-1">
          {getText('common.settings')}
        </p>
      </div>

      {/* Profile Information */}
      <Card>
        <div className="flex items-center mb-6">
          <User className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Profile Information
          </h2>
        </div>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label={getText('auth.first_name')}
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <Input
              label={getText('auth.last_name')}
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          <Input
            label={getText('auth.email')}
            type="email"
            value={formData.email}
            disabled
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {getText('dashboard.plan')}
            </label>
            <Badge className={getRoleBadgeColor(user?.role || '')}>
              {user?.role}
            </Badge>
          </div>

          <Button variant="primary" disabled>
            {getText('common.save')} (Coming Soon)
          </Button>
        </div>
      </Card>

      {/* Security */}
      <Card>
        <div className="flex items-center mb-6">
          <Shield className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Security</h2>
        </div>

        <div className="space-y-4">
          <Button variant="outline" disabled>
            Change Password (Coming Soon)
          </Button>
        </div>
      </Card>

      {/* API Keys */}
      <Card>
        <div className="flex items-center mb-6">
          <Key className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">API Keys</h2>
        </div>

        <div className="space-y-6">
          {/* Google Gemini API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Gemini API Key
                </label>
                <p className="text-xs text-gray-500">
                  {apiKeys?.googleGemini.hasKey
                    ? `Current: ${apiKeys.googleGemini.maskedKey}`
                    : 'No API key saved'}
                </p>
              </div>
              {apiKeys?.googleGemini.hasKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey('google_gemini')}
                  disabled={deleting.google_gemini}
                  isLoading={deleting.google_gemini}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Google Gemini API key"
                value={apiKeyInputs.google_gemini}
                onChange={(e) =>
                  setApiKeyInputs({
                    ...apiKeyInputs,
                    google_gemini: e.target.value,
                  })
                }
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleVerifyApiKey('google_gemini')}
                disabled={verifying.google_gemini || !apiKeyInputs.google_gemini?.trim()}
                isLoading={verifying.google_gemini}
              >
                Verify
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveApiKey('google_gemini')}
                disabled={
                  saving.google_gemini ||
                  !apiKeyInputs.google_gemini?.trim() ||
                  (verifyResults.google_gemini?.valid === false)
                }
                isLoading={saving.google_gemini}
              >
                Save
              </Button>
            </div>
            {verifyResults.google_gemini && (
              <div
                className={`p-3 rounded-lg ${
                  verifyResults.google_gemini.valid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {verifyResults.google_gemini.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        verifyResults.google_gemini.valid
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {verifyResults.google_gemini.valid
                        ? verifyResults.google_gemini.message
                        : verifyResults.google_gemini.error}
                    </p>
                    {verifyResults.google_gemini.valid &&
                      verifyResults.google_gemini.availableModels &&
                      verifyResults.google_gemini.availableModels.length > 0 && (
                        <p className="text-xs text-green-700 mt-1">
                          Available models: {verifyResults.google_gemini.availableModels.join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* OpenAI API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OpenAI API Key
                </label>
                <p className="text-xs text-gray-500">
                  {apiKeys?.openai.hasKey
                    ? `Current: ${apiKeys.openai.maskedKey}`
                    : 'No API key saved'}
                </p>
              </div>
              {apiKeys?.openai.hasKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey('openai')}
                  disabled={deleting.openai}
                  isLoading={deleting.openai}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your OpenAI API key"
                value={apiKeyInputs.openai}
                onChange={(e) =>
                  setApiKeyInputs({
                    ...apiKeyInputs,
                    openai: e.target.value,
                  })
                }
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleVerifyApiKey('openai')}
                disabled={verifying.openai || !apiKeyInputs.openai?.trim()}
                isLoading={verifying.openai}
              >
                Verify
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveApiKey('openai')}
                disabled={
                  saving.openai ||
                  !apiKeyInputs.openai?.trim() ||
                  (verifyResults.openai?.valid === false)
                }
                isLoading={saving.openai}
              >
                Save
              </Button>
            </div>
            {verifyResults.openai && (
              <div
                className={`p-3 rounded-lg ${
                  verifyResults.openai.valid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {verifyResults.openai.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        verifyResults.openai.valid
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {verifyResults.openai.valid
                        ? verifyResults.openai.message
                        : verifyResults.openai.error}
                    </p>
                    {verifyResults.openai.valid &&
                      verifyResults.openai.availableModels &&
                      verifyResults.openai.availableModels.length > 0 && (
                        <p className="text-xs text-green-700 mt-1">
                          Available models: {verifyResults.openai.availableModels.join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hugging Face API Key */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hugging Face API Key
                </label>
                <p className="text-xs text-gray-500">
                  {apiKeys?.huggingface.hasKey
                    ? `Current: ${apiKeys.huggingface.maskedKey}`
                    : 'No API key saved'}
                </p>
              </div>
              {apiKeys?.huggingface.hasKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteApiKey('huggingface')}
                  disabled={deleting.huggingface}
                  isLoading={deleting.huggingface}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter your Hugging Face API key"
                value={apiKeyInputs.huggingface}
                onChange={(e) =>
                  setApiKeyInputs({
                    ...apiKeyInputs,
                    huggingface: e.target.value,
                  })
                }
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={() => handleVerifyApiKey('huggingface')}
                disabled={verifying.huggingface || !apiKeyInputs.huggingface?.trim()}
                isLoading={verifying.huggingface}
              >
                Verify
              </Button>
              <Button
                variant="primary"
                onClick={() => handleSaveApiKey('huggingface')}
                disabled={
                  saving.huggingface ||
                  !apiKeyInputs.huggingface?.trim() ||
                  (verifyResults.huggingface?.valid === false)
                }
                isLoading={saving.huggingface}
              >
                Save
              </Button>
            </div>
            {verifyResults.huggingface && (
              <div
                className={`p-3 rounded-lg ${
                  verifyResults.huggingface.valid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {verifyResults.huggingface.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`text-sm font-medium ${
                        verifyResults.huggingface.valid
                          ? 'text-green-800'
                          : 'text-red-800'
                      }`}
                    >
                      {verifyResults.huggingface.valid
                        ? verifyResults.huggingface.message
                        : verifyResults.huggingface.error}
                    </p>
                    {verifyResults.huggingface.valid &&
                      verifyResults.huggingface.availableModels &&
                      verifyResults.huggingface.availableModels.length > 0 && (
                        <p className="text-xs text-green-700 mt-1">
                          Available models: {verifyResults.huggingface.availableModels.join(', ')}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> API keys are stored securely and will be used for AI content generation. 
              Make sure to verify your API key before saving.
            </p>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <div className="flex items-center mb-6">
          <Bell className="h-6 w-6 text-gray-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">
            Notifications
          </h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-600">
                Receive email about your account activity
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
              disabled
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Credit Alerts</p>
              <p className="text-sm text-gray-600">
                Get notified when credits are running low
              </p>
            </div>
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              defaultChecked
              disabled
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

