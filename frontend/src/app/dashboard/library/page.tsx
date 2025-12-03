'use client';

import { useEffect, useState } from 'react';
import { useLanguageStore } from '@/store/languageStore';
import { contentsApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Video, Trash2, Copy, Download, Trash } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function LibraryPage() {
  const [contents, setContents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { locale } = useLanguageStore();
  const [t, setT] = useState<any>({});

  useEffect(() => {
    import(`../../../../messages/${locale}.json`).then((msgs) => {
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
    fetchContents();
  }, []);

  const fetchContents = async () => {
    setIsLoading(true);
    try {
      const response = await contentsApi.getAll();
      // Filter image and video contents
      const mediaContents = response.data.filter((content: any) => {
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
    } catch (error) {
      toast.error('Failed to fetch contents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      await contentsApi.delete(id);
      setContents(contents.filter((c) => c.id !== id));
      toast.success('Content deleted successfully');
    } catch (error) {
      toast.error('Failed to delete content');
    }
  };

  const handleDeleteAll = async () => {
    if (contents.length === 0) {
      toast.error('No images to delete');
      return;
    }

    const confirmMessage = `Are you sure you want to delete all ${contents.length} image(s)? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    try {
      // Delete all images one by one
      const deletePromises = contents.map((content) => contentsApi.delete(content.id));
      await Promise.all(deletePromises);
      
      setContents([]);
      toast.success(`Successfully deleted ${contents.length} image(s)`);
    } catch (error) {
      toast.error('Failed to delete some images');
      // Refresh the list to show remaining images
      fetchContents();
    }
  };

  const handleCopy = (imageUrl: string) => {
    navigator.clipboard.writeText(imageUrl);
    toast.success('Image URL copied to clipboard!');
  };

  const handleDownload = (title: string, mediaUrl: string) => {
    // Check if it's a base64 media or URL
    if (mediaUrl.startsWith('data:image/')) {
      // Base64 image
      const base64Data = mediaUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded!');
    } else if (mediaUrl.startsWith('data:video/')) {
      // Base64 video
      const base64Data = mediaUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'video'}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Video downloaded!');
    } else {
      // URL media - fetch and download
      fetch(mediaUrl)
        .then(res => res.blob())
        .then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const isVideo = mediaUrl.includes('.mp4') || blob.type.startsWith('video/');
          a.download = `${title || (isVideo ? 'video' : 'image')}.${isVideo ? 'mp4' : 'png'}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success(`${isVideo ? 'Video' : 'Image'} downloaded!`);
        })
        .catch(() => {
          toast.error(`Failed to download ${mediaUrl.includes('.mp4') ? 'video' : 'image'}`);
        });
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
          <h1 className="text-3xl font-bold text-gray-900">{getText('library.title')}</h1>
          <p className="text-gray-600 mt-1">
            {getText('library.subtitle')}
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

      {/* Images Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : contents.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{getText('library.no_content') || 'No images generated yet'}</p>
            <Button
              variant="primary"
              className="mt-4"
              onClick={() => (window.location.href = '/dashboard/generate')}
            >
              {getText('library.generate_content') || 'Generate Image'}
            </Button>
          </div>
        </Card>
      ) : (
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
                    
                    <p className="text-xs text-gray-500 mb-3">
                      {getText('library.created') || 'Created'}: {formatDate(content.createdAt)}
                    </p>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(mediaUrl)}
                        className="flex-1"
                        title={`Copy ${isMediaVideo ? 'video' : 'image'} URL`}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(content.title || (isMediaVideo ? 'video' : 'image'), mediaUrl)}
                        className="flex-1"
                        title={`Download ${isMediaVideo ? 'video' : 'image'}`}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(content.id)}
                        className="text-red-600 hover:text-red-700"
                        title={`Delete ${isMediaVideo ? 'video' : 'image'}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

