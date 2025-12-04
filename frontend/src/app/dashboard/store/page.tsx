'use client';

import { useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { useAuthStore } from '@/store/authStore';
import { usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { FileText, Video, Search, Filter, ShoppingCart, CheckCircle, Sparkles, Eye, X, Calendar, Tag, DollarSign, Lock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Template = {
  id: string;
  type: 'SEO_ARTICLE' | 'REEL_SCRIPT';
  name: string;
  template: string;
  description?: string;
  thumbnail?: string;
  isPaid: boolean;
  price: number;
  priceType: string;
  category?: string;
  tags: string[];
  isActive: boolean;
  isPurchased: boolean;
  createdAt: string;
};

export default function StorePage() {
  const { locale } = useLanguageStore();
  const { user, fetchUser } = useAuthStore();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'SEO_ARTICLE' | 'REEL_SCRIPT'>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../../../messages/${locale}.json`).then((msgs) => {
      setT(msgs.default);
    });
  }, [locale]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    filterTemplates();
  }, [templates, searchQuery, typeFilter]);

  const getText = (key: string) => {
    const keys = key.split('.');
    let value = t;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getStoreTemplates();
      setTemplates(response.data);
    } catch (error: any) {
      console.error('Failed to fetch templates:', error);
      toast.error(error?.response?.data?.message || 'Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filterTemplates = () => {
    let filtered = templates;

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.template.toLowerCase().includes(query) ||
          t.category?.toLowerCase().includes(query) ||
          t.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handlePurchase = async (template: Template) => {
    if (template.isPurchased) {
      // Navigate to generate page to use the template
      router.push(`/dashboard/generate?template=${template.id}&type=${template.type.toLowerCase()}`);
      return;
    }

    if (!template.isPaid || template.price === 0) {
      // Free template - navigate to generate page
      router.push(`/dashboard/generate?template=${template.id}&type=${template.type.toLowerCase()}`);
      return;
    }

    // Check credits
    const creditsNeeded = Math.ceil(template.price);
    if (template.priceType === 'credits') {
      if (template.type === 'SEO_ARTICLE') {
        if ((user?.seoCredits || 0) < creditsNeeded) {
          toast.error(`Insufficient SEO credits. You need ${creditsNeeded} credits.`);
          return;
        }
      } else if (template.type === 'REEL_SCRIPT') {
        if ((user?.reelCredits || 0) < creditsNeeded) {
          toast.error(`Insufficient Reel credits. You need ${creditsNeeded} credits.`);
          return;
        }
      }
    }

    setPurchasingId(template.id);
    try {
      await usersApi.purchaseTemplate(template.id);
      toast.success('Template purchased successfully!');
      await fetchUser(); // Refresh user credits
      fetchTemplates(); // Refresh templates list
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to purchase template');
    } finally {
      setPurchasingId(null);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'SEO_ARTICLE' ? FileText : Video;
  };

  const getTypeColor = (type: string) => {
    return type === 'SEO_ARTICLE' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800';
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleViewTemplate = (template: Template) => {
    try {
      // Check if user has permission to view
      if (template.isPaid && !template.isPurchased) {
        toast.error('Please purchase this template first to view details');
        return;
      }
      setViewingTemplate(template);
    } catch (error) {
      console.error('Error viewing template:', error);
      toast.error('Failed to open template details');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{getText('store.title')}</h1>
          <p className="text-gray-600 mt-1">
            {getText('store.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">{getText('store.seo_credits')}</p>
            <p className="text-2xl font-bold text-primary-600">{user?.seoCredits || 0}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">{getText('store.reel_credits')}</p>
            <p className="text-2xl font-bold text-primary-600">{user?.reelCredits || 0}</p>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={getText('store.search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex gap-2">
              <Button
                variant={typeFilter === 'all' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('all')}
              >
                {getText('store.all')}
              </Button>
              <Button
                variant={typeFilter === 'SEO_ARTICLE' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('SEO_ARTICLE')}
              >
                <FileText className="h-4 w-4 mr-1" />
                {getText('store.seo_articles')}
              </Button>
              <Button
                variant={typeFilter === 'REEL_SCRIPT' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setTypeFilter('REEL_SCRIPT')}
              >
                <Video className="h-4 w-4 mr-1" />
                {getText('store.reel_scripts')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium mb-2">
              {searchQuery || typeFilter !== 'all'
                ? getText('store.no_results')
                : getText('store.no_templates')}
            </p>
            {searchQuery || typeFilter !== 'all' ? (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                }}
              >
                {getText('store.clear_filters')}
              </Button>
            ) : null}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const Icon = getTypeIcon(template.type);

            return (
              <Card key={template.id} hover className="flex flex-col overflow-hidden">
                {/* Image Section - Large and Prominent */}
                <div className="relative w-full h-64 bg-gradient-to-br from-primary-100 to-primary-200 overflow-hidden">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default image if thumbnail fails to load
                        const target = e.target as HTMLImageElement;
                        target.src = template.type === 'SEO_ARTICLE' 
                          ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
                          : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop';
                      }}
                    />
                  ) : (
                    <img
                      src={template.type === 'SEO_ARTICLE' 
                        ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
                        : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop'}
                      alt={template.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  )}
                  {/* Badge overlay */}
                  <div className="absolute top-3 right-3">
                    <Badge className={getTypeColor(template.type)}>
                      {template.type === 'SEO_ARTICLE'
                        ? getText('content_types.seo')
                        : getText('content_types.reel')}
                    </Badge>
                  </div>
                  {/* Price/Status overlay */}
                  <div className="absolute top-3 left-3">
                    {template.isPurchased ? (
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {getText('store.purchased')}
                      </Badge>
                    ) : template.isPaid ? (
                      <Badge className="bg-white text-primary-600 font-bold">
                        {template.price} {template.priceType === 'credits' ? 'Credits' : '$'}
                      </Badge>
                    ) : (
                      <Badge className="bg-white text-gray-800">Free</Badge>
                    )}
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col">
                  {/* Title - Large and Prominent */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {template.name}
                  </h3>

                  {/* Description */}
                  {template.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}

                  {/* Tags */}
                  {template.tags && template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {template.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          className="bg-gray-100 text-gray-600 text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewTemplate(template)}
                      className="flex-1"
                      disabled={template.isPaid && !template.isPurchased}
                      title={template.isPaid && !template.isPurchased ? 'Please purchase first to view' : 'View template details'}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      {getText('store.view')}
                    </Button>
                    <Button
                      variant={template.isPurchased ? 'primary' : 'primary'}
                      size="sm"
                      onClick={() => handlePurchase(template)}
                      disabled={purchasingId === template.id}
                      className="flex-1"
                    >
                      {purchasingId === template.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          {getText('store.purchasing')}
                        </>
                      ) : template.isPurchased ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {getText('store.use')}
                        </>
                      ) : template.isPaid ? (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          {getText('store.buy')}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-1" />
                          {getText('store.use')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Results Count */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="text-center text-sm text-gray-500">
          {getText('store.showing')} {filteredTemplates.length} {getText('store.of')}{' '}
          {templates.length} {getText('store.templates')}
        </div>
      )}

      {/* Template Details Modal */}
      {viewingTemplate && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking outside
            if (e.target === e.currentTarget) {
              setViewingTemplate(null);
            }
          }}
        >
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Info className="h-6 w-6" />
                Template Details
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setViewingTemplate(null)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start gap-4">
                {viewingTemplate.thumbnail && (
                  <img
                    src={viewingTemplate.thumbnail}
                    alt={viewingTemplate.name}
                    className="w-32 h-32 object-cover rounded-lg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = viewingTemplate.type === 'SEO_ARTICLE' 
                        ? 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop'
                        : 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop';
                    }}
                  />
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getTypeColor(viewingTemplate.type)}>
                      {viewingTemplate.type === 'SEO_ARTICLE'
                        ? getText('content_types.seo')
                        : getText('content_types.reel')}
                    </Badge>
                    {viewingTemplate.isPurchased ? (
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {getText('store.purchased')}
                      </Badge>
                    ) : viewingTemplate.isPaid ? (
                      <Badge className="bg-primary-100 text-primary-800 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        Premium
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-800">Free</Badge>
                    )}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {viewingTemplate.name}
                  </h3>
                  {viewingTemplate.description && (
                    <p className="text-gray-600">{viewingTemplate.description}</p>
                  )}
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Price</p>
                    <p className="font-semibold text-gray-900">
                      {viewingTemplate.isPaid ? (
                        <>
                          {viewingTemplate.price} {viewingTemplate.priceType === 'credits' ? 'Credits' : '$'}
                        </>
                      ) : (
                        'Free'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-xs text-gray-500">Created</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(viewingTemplate.createdAt)}
                    </p>
                  </div>
                </div>
                {viewingTemplate.category && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <Tag className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-semibold text-gray-900">
                        {viewingTemplate.category}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tags */}
              {viewingTemplate.tags && viewingTemplate.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingTemplate.tags.map((tag) => (
                      <Badge key={tag} className="bg-gray-100 text-gray-600">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Template Preview */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Template Preview</h4>
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  {viewingTemplate.isPaid && !viewingTemplate.isPurchased ? (
                    <div className="text-center py-8">
                      <Lock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 font-medium mb-2">
                        This template requires purchase
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        Purchase this template to view the full content
                      </p>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setViewingTemplate(null);
                          handlePurchase(viewingTemplate);
                        }}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase Now
                      </Button>
                    </div>
                  ) : (
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                      {viewingTemplate.template}
                    </pre>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setViewingTemplate(null)}
                  className="flex-1"
                >
                  Close
                </Button>
                {viewingTemplate.isPaid && !viewingTemplate.isPurchased ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setViewingTemplate(null);
                      handlePurchase(viewingTemplate);
                    }}
                    className="flex-1"
                    disabled={purchasingId === viewingTemplate.id}
                  >
                    {purchasingId === viewingTemplate.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Purchase Template
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    onClick={() => {
                      try {
                        setViewingTemplate(null);
                        const type = viewingTemplate.type.toLowerCase();
                        router.push(`/dashboard/generate?template=${viewingTemplate.id}&type=${type}`);
                      } catch (error) {
                        console.error('Error navigating to generate page:', error);
                        toast.error('Failed to navigate to generate page');
                      }
                    }}
                    className="flex-1"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Use Template
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

