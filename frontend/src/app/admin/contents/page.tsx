'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Video, Trash2, Trash } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminContentsPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContents(currentPage);
  }, [currentPage]);

  const fetchContents = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await adminApi.getContents(page, 20);
      // Filter image and video contents
      const allContents = response.data.contents || [];
      const mediaContents = allContents.filter((content: any) => {
        const contentStr = content.content || '';
        const metadata = content.metadata || {};
        return contentStr.startsWith('data:image/') || 
               contentStr.startsWith('data:video/') ||
               contentStr.startsWith('http://') || 
               contentStr.startsWith('https://') ||
               metadata.type === 'image' ||
               metadata.type === 'video';
      });
      setContents(mediaContents);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch contents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await adminApi.deleteContent(contentId);
      toast.success('Content deleted successfully');
      fetchContents(currentPage);
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleDeleteAll = async () => {
    if (contents.length === 0) {
      toast.error('No content to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete all ${contents.length} item(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      // Delete all images one by one
      const deletePromises = contents.map((content) => adminApi.deleteContent(content.id));
      await Promise.all(deletePromises);
      
      toast.success(`Successfully deleted ${contents.length} item(s)`);
      fetchContents(currentPage);
    } catch (error) {
      toast.error('Failed to delete some content');
      // Refresh the list to show remaining images
      fetchContents(currentPage);
    }
  };

  const isImage = (content: string) => {
    return content.startsWith('data:image/') || 
           (content.startsWith('http://') && !content.includes('.mp4')) || 
           (content.startsWith('https://') && !content.includes('.mp4'));
  };

  const isVideo = (content: string, metadata?: any) => {
    return content.startsWith('data:video/') || 
           content.includes('.mp4') ||
           (metadata && metadata.type === 'video');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contents Management</h1>
          <p className="text-gray-600 mt-1">
            View and manage all generated images
          </p>
        </div>
        {contents.length > 0 && (
          <Button
            variant="outline"
            onClick={handleDeleteAll}
            className="text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete All ({contents.length})
          </Button>
        )}
      </div>

      {isLoading ? (
        <Card>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </Card>
      ) : contents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No content found</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contents.map((content) => {
              const mediaUrl = content.content;
              const metadata = content.metadata || {};
              const isMediaImage = isImage(mediaUrl);
              const isMediaVideo = isVideo(mediaUrl, metadata);
              
              return (
                <Card key={content.id} hover className="overflow-hidden">
                  <div className="flex flex-col">
                    {/* Media Preview */}
                    <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
                      {isMediaVideo ? (
                        <video
                          src={mediaUrl}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : isMediaImage ? (
                        <img
                          src={mediaUrl}
                          alt={content.title || 'Generated Image'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/512x512?text=Image+Error';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-16 w-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Media Info */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                          {content.title || (isMediaVideo ? 'Generated Video' : 'Generated Image')}
                        </h3>
                        <Badge variant={isMediaVideo ? 'info' : 'success'}>
                          {isMediaVideo ? 'Video' : 'Image'}
                        </Badge>
                      </div>
                      
                      {content.prompt && (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                          Prompt: {content.prompt}
                        </p>
                      )}
                      
                      <p className="text-xs text-gray-600 mb-1">
                        By: {content.user?.email || 'Unknown'}
                      </p>
                      
                      <p className="text-xs text-gray-500 mb-3">
                        Created: {formatDate(content.createdAt)}
                      </p>
                      
                      {/* Actions */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(content.id)}
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
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
    </div>
  );
}

