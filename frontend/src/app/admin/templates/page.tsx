'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, FileText, Video, X, Save } from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
  createdAt: string;
  updatedAt: string;
  _count?: { purchases: number };
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    type: 'SEO_ARTICLE' as 'SEO_ARTICLE' | 'REEL_SCRIPT',
    name: '',
    template: '',
    description: '',
    thumbnail: '',
    isPaid: false,
    price: 0,
    priceType: 'credits',
    category: '',
    tags: [] as string[],
    isActive: true,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await adminApi.getTemplates();
      setTemplates(response.data);
    } catch (error) {
      toast.error('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      type: 'SEO_ARTICLE',
      name: '',
      template: '',
      description: '',
      thumbnail: '',
      isPaid: false,
      price: 0,
      priceType: 'credits',
      category: '',
      tags: [],
      isActive: true,
    });
    setShowModal(true);
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      type: template.type,
      name: template.name,
      template: template.template,
      description: template.description || '',
      thumbnail: template.thumbnail || '',
      isPaid: template.isPaid,
      price: template.price,
      priceType: template.priceType,
      category: template.category || '',
      tags: template.tags || [],
      isActive: template.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editingTemplate) {
        await adminApi.updateTemplate(editingTemplate.id, formData);
        toast.success('Template updated successfully');
      } else {
        await adminApi.createTemplate(formData);
        toast.success('Template created successfully');
      }
      setShowModal(false);
      fetchTemplates();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await adminApi.deleteTemplate(id);
      toast.success('Template deleted successfully');
      fetchTemplates();
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates Management</h1>
          <p className="text-gray-600 mt-1">
            Create and manage AI prompt templates
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => {
            const Icon = template.type === 'SEO_ARTICLE' ? FileText : Video;
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
                    <Badge
                      className={
                        template.type === 'SEO_ARTICLE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-purple-100 text-purple-800'
                      }
                    >
                      {template.type === 'SEO_ARTICLE' ? 'SEO' : 'Reel'}
                    </Badge>
                  </div>
                  {/* Price/Status overlay */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {template.isPaid ? (
                      <Badge className="bg-white text-primary-600 font-bold">
                        {template.price} {template.priceType === 'credits' ? 'Credits' : '$'}
                      </Badge>
                    ) : (
                      <Badge className="bg-white text-gray-800">Free</Badge>
                    )}
                    {!template.isActive && (
                      <Badge className="bg-red-100 text-red-800">Inactive</Badge>
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

                  {/* Stats */}
                  <div className="flex items-center gap-2 mb-4">
                    {template.isActive && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                    {template._count && (
                      <Badge className="bg-gray-100 text-gray-800">
                        {template._count.purchases} purchases
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowModal(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="SEO_ARTICLE">SEO Article</option>
                  <option value="REEL_SCRIPT">Reel Script</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Template name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Template description"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template (Prompt) *
                </label>
                <Textarea
                  value={formData.template}
                  onChange={(e) =>
                    setFormData({ ...formData, template: e.target.value })
                  }
                  placeholder="Enter the prompt template. Use {{variable}} for placeholders."
                  rows={8}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thumbnail URL
                </label>
                <Input
                  value={formData.thumbnail}
                  onChange={(e) =>
                    setFormData({ ...formData, thumbnail: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) =>
                      setFormData({ ...formData, isPaid: e.target.checked })
                    }
                    className="mr-2"
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Paid Template
                  </label>
                </div>

                {formData.isPaid && (
                  <>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="Price"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <select
                      value={formData.priceType}
                      onChange={(e) =>
                        setFormData({ ...formData, priceType: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="credits">Credits</option>
                      <option value="money">Money ($)</option>
                    </select>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g., Marketing, Technology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                  />
                  <Button variant="ghost" onClick={handleAddTag}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-blue-100 text-blue-800 flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-blue-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  className="flex-1"
                  disabled={!formData.name || !formData.template}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Update' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

