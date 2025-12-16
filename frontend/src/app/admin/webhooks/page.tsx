'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Copy } from 'lucide-react';

export default function AdminWebhooksPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [n8nUrl, setN8nUrl] = useState('');

  const backendWebhookUrl = `${process.env.NEXT_PUBLIC_API_URL || ''}/payments/webhook`;

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage]);

  const fetchLogs = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getWebhooks(page, 50);
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch webhook logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch (err) {
      toast.error('Copy failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Webhook Logs</h1>
        <p className="text-gray-600 mt-1">
          Monitor Stripe webhook events
        </p>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Configure webhook endpoints</h2>
            <p className="text-sm text-gray-600">
              Add these URLs in Stripe Dashboard → Developers → Webhooks.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              window.open('https://dashboard.stripe.com/test/webhooks', '_blank');
            }}
          >
            Open Stripe Webhooks
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">Backend endpoint (verify signature)</p>
            <div className="flex gap-2">
              <Input value={backendWebhookUrl} readOnly />
              <Button
                variant="outline"
                onClick={() => handleCopy(backendWebhookUrl, 'Backend endpoint')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Use this for the main Stripe webhook (verifies Stripe signature with STRIPE_WEBHOOK_SECRET).
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-800">n8n webhook URL (optional)</p>
            <div className="flex gap-2">
              <Input
                placeholder="https://your-n8n.webhook/..."
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={() => {
                  if (!n8nUrl) {
                    toast.error('Please enter your n8n URL');
                    return;
                  }
                  handleCopy(n8nUrl, 'n8n endpoint');
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              You can add a second endpoint in Stripe pointing to n8n for custom workflows.
            </p>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-900">How to set up in Stripe</p>
          <ol className="mt-2 text-sm text-gray-700 list-decimal list-inside space-y-1">
            <li>Open Stripe Dashboard → Developers → Webhooks.</li>
            <li>Click “Add endpoint” → paste the URL (backend or n8n).</li>
            <li>Select events you need (e.g., invoice.paid, customer.subscription.updated).</li>
            <li>Save and copy the Signing secret; set it in backend env (STRIPE_WEBHOOK_SECRET) if using backend endpoint.</li>
            <li>Send a test event and check logs below.</li>
          </ol>
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-medium text-gray-900">
                          {log.eventType}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600 font-mono">
                          {log.eventId}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={log.processed ? 'success' : 'warning'}
                        >
                          {log.processed ? 'Processed' : 'Pending'}
                        </Badge>
                        {log.error && (
                          <p className="text-xs text-red-600 mt-1">
                            {log.error}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
