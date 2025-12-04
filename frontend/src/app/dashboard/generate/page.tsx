'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useLanguageStore } from '@/store/languageStore';
import { aiApi, usersApi } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Badge from '@/components/ui/Badge';
import toast from 'react-hot-toast';
import { Image as ImageIcon, Copy, Download, Sparkles, Cpu, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function GeneratePage() {
  const { user, updateCredits } = useAuthStore();
  const { locale } = useLanguageStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generationType, setGenerationType] = useState<'image' | 'video'>('image');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<any>(null);
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [t, setT] = useState<any>({});
  const [availableModels, setAvailableModels] = useState<{
    googleGemini: { hasKey: boolean; models: string[]; error?: string };
    openai: { hasKey: boolean; models: string[]; error?: string };
    huggingface: { hasKey: boolean; models: string[]; error?: string };
  } | null>(null);
  const [showModelsModal, setShowModelsModal] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedModel, setSelectedModel] = useState<{
    provider: 'google_gemini' | 'openai' | 'huggingface' | null;
    model: string | null;
  }>({ provider: null, model: null });
  const [modelTestResults, setModelTestResults] = useState<{
    [key: string]: { testing: boolean; success?: boolean; error?: string; message?: string };
  }>({});

  useEffect(() => {
    import(`../../../../messages/${locale}.json`).then((msgs) => {
      setT(msgs.default);
    });
    loadSelectedModel();
    loadTemplateFromUrl();
  }, [locale]);

  const loadTemplateFromUrl = async () => {
    const templateId = searchParams.get('template');
    if (!templateId) return;

    // Validate template ID is not empty and is a valid UUID format
    if (!templateId || templateId.trim() === '') {
      return;
    }

    setLoadingTemplate(true);
    try {
      // Get all templates and find the one with matching ID
      const response = await usersApi.getStoreTemplates();
      
      if (!response?.data || !Array.isArray(response.data)) {
        toast.error('Failed to load templates');
        return;
      }

      const template = response.data.find((t: any) => t.id === templateId);
      
      if (template) {
        // Set the template content as the prompt
        // Replace {{topic}} placeholder with empty string or keep it for user to fill
        let templateContent = template.template || '';
        // Optionally replace {{topic}} with empty string or placeholder
        templateContent = templateContent.replace(/\{\{topic\}\}/g, '');
        setPrompt(templateContent);
        toast.success('Template loaded!');
      } else {
        toast.error('Template not found');
        // Optionally redirect to store page
        router.push('/dashboard/store');
      }
    } catch (error: any) {
      console.error('Failed to load template:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load template';
      toast.error(errorMessage);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const loadSelectedModel = async () => {
    try {
      const response = await usersApi.getApiKeys();
      if (response.data.googleGemini.selectedModel) {
        setSelectedModel({ provider: 'google_gemini', model: response.data.googleGemini.selectedModel });
      } else if (response.data.openai.selectedModel) {
        setSelectedModel({ provider: 'openai', model: response.data.openai.selectedModel });
      } else if (response.data.huggingface.selectedModel) {
        setSelectedModel({ provider: 'huggingface', model: response.data.huggingface.selectedModel });
      }
    } catch (error) {
      console.error('Failed to load selected model:', error);
    }
  };

  // Check if text contains Thai characters
  const containsThai = (text: string): boolean => {
    const thaiPattern = /[\u0E00-\u0E7F]/;
    return thaiPattern.test(text);
  };

  // Translate Thai to English using Google Translate API (free)
  const translateThaiToEnglish = async (text: string): Promise<string> => {
    if (!containsThai(text)) {
      return text; // No Thai characters, return as is
    }

    try {
      setIsTranslating(true);
      // Use Google Translate API (free, no API key needed for basic usage)
      // Using translate.googleapis.com endpoint
      const response = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=th&tl=en&dt=t&q=${encodeURIComponent(text)}`
      );
      
      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      const translatedText = data[0]?.map((item: any[]) => item[0]).join('') || text;
      setIsTranslating(false);
      return translatedText;
    } catch (error) {
      console.error('Translation error:', error);
      setIsTranslating(false);
      return text; // Return original text if translation fails
    }
  };

  // Debounce timer for translation
  const [translationTimer, setTranslationTimer] = useState<NodeJS.Timeout | null>(null);

  // Handle prompt change with auto-translation
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    
    // Clear previous timer
    if (translationTimer) {
      clearTimeout(translationTimer);
    }
    
    // Auto-translate if contains Thai characters (debounce)
    if (containsThai(value) && value.trim().length > 0) {
      // Wait a bit for user to finish typing
      const timer = setTimeout(async () => {
        const translated = await translateThaiToEnglish(value);
        if (translated !== value && translated.trim().length > 0) {
          setPrompt(translated);
          toast.success('Translated to English automatically');
        }
      }, 1500); // Wait 1.5 seconds after user stops typing
      
      setTranslationTimer(timer);
    }
  };

  const testModel = async (provider: 'google_gemini' | 'openai' | 'huggingface', model: string) => {
    const modelKey = `${provider}:${model}`;
    setModelTestResults(prev => ({ ...prev, [modelKey]: { testing: true } }));
    
    try {
      const response = await usersApi.testModel(provider, model);
      const result = response.data;
      
      setModelTestResults(prev => ({
        ...prev,
        [modelKey]: {
          testing: false,
          success: result.success,
          error: result.error,
          message: result.message,
        },
      }));
      
      if (result.success) {
        toast.success(`✅ ${model} is working!`);
      } else {
        toast.error(`❌ ${model}: ${result.error}`);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to test model';
      setModelTestResults(prev => ({
        ...prev,
        [modelKey]: {
          testing: false,
          success: false,
          error: errorMessage,
        },
      }));
      toast.error(`Failed to test ${model}`);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  const loadAvailableModels = async () => {
    setLoadingModels(true);
    try {
      console.log('🔍 Loading available models...');
      const response = await usersApi.getAvailableModels();
      console.log('📦 Response data:', response.data);
      
      setAvailableModels(response.data);
      setShowModelsModal(true);
      
      
      // Show info if no API keys configured
      if (!response.data.googleGemini.hasKey && !response.data.openai.hasKey && !response.data.huggingface.hasKey) {
        toast('No API keys configured. Please add your API keys in Settings.', {
          icon: 'ℹ️',
          duration: 4000,
        });
      } else {
        // Show success message if models loaded
        const totalModels = (response.data.googleGemini.models?.length || 0) + 
                           (response.data.openai.models?.length || 0) +
                           (response.data.huggingface.models?.length || 0);
        if (totalModels > 0) {
          toast.success(`Found ${totalModels} available model(s)`);
        } else if (response.data.googleGemini.hasKey || response.data.openai.hasKey || response.data.huggingface.hasKey) {
          toast('API keys configured but no models found. Check API key validity.', {
            icon: '⚠️',
            duration: 4000,
          });
        }
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load available models';
      toast.error(errorMessage);
      console.error('❌ Failed to load models:', error);
      console.error('Error response:', error.response?.data);
      
      // Still show modal with error state
      setAvailableModels({
        googleGemini: { hasKey: false, models: [], error: errorMessage },
        openai: { hasKey: false, models: [], error: errorMessage },
        huggingface: { hasKey: false, models: [], error: errorMessage },
      });
      setShowModelsModal(true);
    } finally {
      setLoadingModels(false);
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);
    setGeneratedVideo(null);

    try {
      if (generationType === 'image') {
        const response = await aiApi.generateImage(prompt);
        setGeneratedImage(response.data);

        // Update credits in store
        if (response.data.creditsRemaining !== undefined) {
          updateCredits(response.data.creditsRemaining, user?.reelCredits || 0);
        } else {
          // Deduct 1 credit if not sample
          if (!response.data.isSample && user?.seoCredits) {
            updateCredits((user.seoCredits || 0) - 1, user?.reelCredits || 0);
          }
        }

        toast.success('Image generated successfully!');
      } else {
        const response = await aiApi.generateVideo(prompt);
        setGeneratedVideo(response.data);

        // Update credits in store
        if (response.data.creditsRemaining !== undefined) {
          updateCredits(response.data.creditsRemaining, user?.reelCredits || 0);
        } else {
          // Deduct 1 credit if not sample
          if (!response.data.isSample && user?.seoCredits) {
            updateCredits((user.seoCredits || 0) - 1, user?.reelCredits || 0);
          }
        }

        toast.success('Video generated successfully!');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || `Failed to generate ${generationType}`;
      
      // Show detailed error message
      toast.error(errorMessage, {
        duration: 6000, // Show longer for detailed messages
      });
      
      // If it's a video generation error about missing API keys, show additional help
      if (generationType === 'video' && errorMessage.includes('API key')) {
        setTimeout(() => {
          toast(
            (t) => (
              <div className="text-sm">
                <p className="font-semibold mb-1">💡 Need help?</p>
                <p className="mb-2">Video generation requires an image first. Add an API key in Settings:</p>
                <a 
                  href="/dashboard/settings" 
                  className="text-primary-600 underline font-semibold"
                  onClick={() => toast.dismiss(t.id)}
                >
                  Go to Settings →
                </a>
              </div>
            ),
            { duration: 8000 }
          );
        }, 1000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generationType === 'image' && generatedImage?.imageUrl) {
      navigator.clipboard.writeText(generatedImage.imageUrl);
      toast.success('Image URL copied to clipboard!');
    } else if (generationType === 'video' && generatedVideo?.videoUrl) {
      navigator.clipboard.writeText(generatedVideo.videoUrl);
      toast.success('Video URL copied to clipboard!');
    }
  };

  const handleDownload = async () => {
    if (generationType === 'image' && generatedImage?.imageUrl) {
      try {
        const response = await fetch(generatedImage.imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Image downloaded!');
      } catch (error) {
        toast.error('Failed to download image');
      }
    } else if (generationType === 'video' && generatedVideo?.videoUrl) {
      try {
        const response = await fetch(generatedVideo.videoUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `generated-video-${Date.now()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Video downloaded!');
      } catch (error) {
        toast.error('Failed to download video');
      }
    }
  };

  const canGenerate = () => {
    if (user?.role === 'FREE') return true; // Can generate samples
    return (user?.seoCredits || 0) > 0;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{getText('generate.title')}</h1>
        <p className="text-gray-600 mt-1">
          {getText('generate.subtitle')}
        </p>
      </div>

      {/* Credits Info */}
      <Card className="bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {getText('generate.credits_remaining')}
            </h3>
            <div className="flex gap-4 mt-2">
              <div>
                <span className="text-sm text-gray-600">Image Credits: </span>
                <span className="text-lg font-bold text-primary-600">
                  {user?.seoCredits || 0}
                </span>
              </div>
            </div>
          </div>
          {!canGenerate() && (
            <Button variant="primary" onClick={() => window.location.href = '/pricing'}>
              {getText('generate.buy_credits')}
            </Button>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Generate {generationType === 'image' ? 'Image' : 'Video'}
            </h2>
            {selectedModel.model && selectedModel.model.includes('dall') && (
              <Badge variant="info" className="text-xs">
                {selectedModel.model.replace('models/', '')}
              </Badge>
            )}
          </div>

          {/* Generation Type Selector */}
          <div className="mb-4">
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setGenerationType('image');
                  setGeneratedImage(null);
                  setGeneratedVideo(null);
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  generationType === 'image'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ImageIcon className="h-4 w-4 inline mr-2" />
                Image
              </button>
              <button
                type="button"
                onClick={() => {
                  setGenerationType('video');
                  setGeneratedImage(null);
                  setGeneratedVideo(null);
                }}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  generationType === 'video'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="h-4 w-4 inline mr-2" />
                Video
              </button>
            </div>
            {generationType === 'video' && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>ℹ️ Video Generation Info:</strong> This will first generate an image from your prompt, then convert it to a video using AI animation.
                </p>
                <p className="text-sm text-blue-700">
                  <strong>⚠️ Required:</strong> You need at least one working image generation API key:
                </p>
                <ul className="text-sm text-blue-700 mt-1 ml-4 list-disc">
                  <li>Google Gemini API key (for Imagen)</li>
                  <li>OpenAI API key (for DALL-E)</li>
                  <li>Hugging Face API key (for Stable Diffusion) - with available quota</li>
                </ul>
                <p className="text-xs text-blue-600 mt-2">
                  Configure your API keys in <a href="/dashboard/settings" className="underline font-semibold">Settings</a>
                </p>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="space-y-4">
            {loadingTemplate && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>Loading template...</span>
              </div>
            )}
            <div className="relative">
              <Textarea
                label={generationType === 'image' ? 'Image Prompt' : 'Video Prompt'}
                placeholder={generationType === 'image' 
                  ? "e.g., A beautiful sunset over the ocean with mountains in the background"
                  : "e.g., A cat playing with a ball in slow motion, cinematic lighting"}
                value={prompt}
                onChange={(e) => handlePromptChange(e.target.value)}
                rows={6}
                disabled={loadingTemplate || isTranslating}
              />
              {isTranslating && (
                <div className="absolute top-10 right-3 flex items-center text-xs text-gray-500">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Translating...
                </div>
              )}
            </div>

            <Button
              variant="outline"
              className="w-full"
              onClick={loadAvailableModels}
              isLoading={loadingModels}
            >
              <Cpu className="h-5 w-5 mr-2" />
              View Available Models
            </Button>

            <Button
              variant="primary"
              className="w-full"
              onClick={handleGenerate}
              isLoading={isGenerating}
              disabled={!canGenerate() && user?.role !== 'FREE'}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              {getText('generate.generate')}
            </Button>

            {user?.role === 'FREE' && (
              <p className="text-sm text-gray-600 text-center">
                {getText('generate.free_warning')}
              </p>
            )}
          </div>
        </Card>

        {/* Output Section */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Generated {generationType === 'image' ? 'Image' : 'Video'}
            </h2>
            {(generatedImage || generatedVideo) && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            )}
          </div>

          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
              <p className="text-gray-600">Generating your {generationType}...</p>
              {generationType === 'video' && (
                <p className="text-sm text-gray-500 mt-2">This may take up to 2 minutes</p>
              )}
            </div>
          ) : generationType === 'image' && generatedImage ? (
            <div className="space-y-4">
              {generatedImage.isSample && (
                <Badge variant="warning" className="mb-2">
                  Sample Image - Upgrade for Full AI Generation
                </Badge>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <img
                  src={generatedImage.imageUrl}
                  alt="Generated image"
                  className="w-full h-auto rounded-lg"
                />
              </div>
              {generatedImage.message && (
                <p className="text-sm text-gray-600 text-center">
                  {generatedImage.message}
                </p>
              )}
            </div>
          ) : generationType === 'video' && generatedVideo ? (
            <div className="space-y-4">
              {generatedVideo.isSample && (
                <Badge variant="warning" className="mb-2">
                  Sample Video - Upgrade for Full AI Generation
                </Badge>
              )}
              <div className="bg-gray-50 rounded-lg p-4">
                <video
                  src={generatedVideo.videoUrl}
                  controls
                  className="w-full h-auto rounded-lg"
                  style={{ maxHeight: '600px' }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
              {generatedVideo.message && (
                <p className="text-sm text-gray-600 text-center">
                  {generatedVideo.message}
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-400">
              {generationType === 'image' ? (
                <>
                  <ImageIcon className="h-16 w-16 mb-4" />
                  <p>Your generated image will appear here</p>
                </>
              ) : (
                <>
                  <Sparkles className="h-16 w-16 mb-4" />
                  <p>Your generated video will appear here</p>
                </>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Available Models Modal */}
      {showModelsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Cpu className="h-6 w-6 mr-2" />
                Available AI Models
              </h2>
              <button
                onClick={() => setShowModelsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Google Gemini Models */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Google Gemini
                  </h3>
                  {availableModels?.googleGemini.hasKey ? (
                    <Badge variant="success">API Key Configured</Badge>
                  ) : (
                    <Badge variant="default">No API Key</Badge>
                  )}
                </div>
                {availableModels?.googleGemini.hasKey ? (
                  <>
                    {availableModels.googleGemini.models.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Select a model ({availableModels.googleGemini.models.length} working models):
                        </p>
                        <div className="space-y-2">
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {availableModels.googleGemini.models.map((model, index) => {
                              const isSelected = selectedModel.provider === 'google_gemini' && selectedModel.model === model;
                              const modelKey = `google_gemini:${model}`;
                              const testResult = modelTestResults[modelKey];
                              return (
                                <div key={index} className="flex-shrink-0 flex flex-col gap-1">
                                  <button
                                    onClick={() => setSelectedModel({ provider: 'google_gemini', model })}
                                    className={`
                                      px-4 py-2 rounded-lg font-mono text-sm transition-all relative
                                      ${isSelected
                                        ? 'bg-primary-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }
                                    `}
                                  >
                                    {model.replace('models/', '')}
                                    {isAdmin && testResult?.success && (
                                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                                    )}
                                    {isAdmin && testResult?.success === false && (
                                      <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-500 bg-white rounded-full" />
                                    )}
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => testModel('google_gemini', model)}
                                      disabled={testResult?.testing}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {testResult?.testing ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Testing...
                                        </>
                                      ) : testResult?.success ? (
                                        <>
                                          <CheckCircle className="h-3 w-3" />
                                          Working
                                        </>
                                      ) : testResult?.success === false ? (
                                        <>
                                          <XCircle className="h-3 w-3" />
                                          Failed
                                        </>
                                      ) : (
                                        'Test'
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {isAdmin && Object.entries(modelTestResults)
                            .filter(([key]) => key.startsWith('google_gemini:'))
                            .map(([key, result]) => {
                              if (result.testing || result.success) return null;
                              const model = key.replace('google_gemini:', '');
                              return (
                                <div key={key} className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                                  <p className="font-mono text-red-800">{model.replace('models/', '')}</p>
                                  <p className="text-red-600">{result.error}</p>
                                </div>
                              );
                            })}
                        </div>
                        {selectedModel.provider === 'google_gemini' && selectedModel.model && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-primary-900 mb-1">
                              Selected Model:
                            </p>
                            <p className="text-sm text-primary-700 font-mono">
                              {selectedModel.model}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : availableModels.googleGemini.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        <p className="font-semibold mb-1">Error:</p>
                        <p>{availableModels.googleGemini.error}</p>
                        <p className="text-xs mt-2 text-red-600">
                          Please check your API key in Settings and try again.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p>No models found. This might be a temporary issue. Please try again later.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      No Google Gemini API key configured.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowModelsModal(false);
                        window.location.href = '/dashboard/settings';
                      }}
                    >
                      Go to Settings
                    </Button>
                  </div>
                )}
              </div>

              {/* OpenAI Models */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    OpenAI
                  </h3>
                  {availableModels?.openai.hasKey ? (
                    <Badge variant="success">API Key Configured</Badge>
                  ) : (
                    <Badge variant="default">No API Key</Badge>
                  )}
                </div>
                {availableModels?.openai.hasKey ? (
                  <>
                    {availableModels.openai.models.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Select a model ({availableModels.openai.models.length} working models):
                        </p>
                        <div className="space-y-2">
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {availableModels.openai.models.map((model, index) => {
                              const isSelected = selectedModel.provider === 'openai' && selectedModel.model === model;
                              const modelKey = `openai:${model}`;
                              const testResult = modelTestResults[modelKey];
                              return (
                                <div key={index} className="flex-shrink-0 flex flex-col gap-1">
                                  <button
                                    onClick={() => setSelectedModel({ provider: 'openai', model })}
                                    className={`
                                      px-4 py-2 rounded-lg font-mono text-sm transition-all relative
                                      ${isSelected
                                        ? 'bg-primary-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }
                                    `}
                                  >
                                    {model}
                                    {isAdmin && testResult?.success && (
                                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                                    )}
                                    {isAdmin && testResult?.success === false && (
                                      <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-500 bg-white rounded-full" />
                                    )}
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => testModel('openai', model)}
                                      disabled={testResult?.testing}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {testResult?.testing ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Testing...
                                        </>
                                      ) : testResult?.success ? (
                                        <>
                                          <CheckCircle className="h-3 w-3" />
                                          Working
                                        </>
                                      ) : testResult?.success === false ? (
                                        <>
                                          <XCircle className="h-3 w-3" />
                                          Failed
                                        </>
                                      ) : (
                                        'Test'
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {isAdmin && Object.entries(modelTestResults)
                            .filter(([key]) => key.startsWith('openai:'))
                            .map(([key, result]) => {
                              if (result.testing || result.success) return null;
                              const model = key.replace('openai:', '');
                              return (
                                <div key={key} className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                                  <p className="font-mono text-red-800">{model}</p>
                                  <p className="text-red-600">{result.error}</p>
                                </div>
                              );
                            })}
                        </div>
                        {selectedModel.provider === 'openai' && selectedModel.model && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-primary-900 mb-1">
                              Selected Model:
                            </p>
                            <p className="text-sm text-primary-700 font-mono">
                              {selectedModel.model}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : availableModels.openai.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        <p className="font-semibold mb-1">Error:</p>
                        <p>{availableModels.openai.error}</p>
                        <p className="text-xs mt-2 text-red-600">
                          Please check your API key in Settings and try again.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p>No models found. This might be a temporary issue. Please try again later.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      No OpenAI API key configured.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowModelsModal(false);
                        window.location.href = '/dashboard/settings';
                      }}
                    >
                      Go to Settings
                    </Button>
                  </div>
                )}
              </div>

              {/* Hugging Face Models */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Hugging Face
                  </h3>
                  {availableModels?.huggingface.hasKey ? (
                    <Badge variant="success">API Key Configured</Badge>
                  ) : (
                    <Badge variant="default">No API Key</Badge>
                  )}
                </div>
                {availableModels?.huggingface.hasKey ? (
                  <>
                    {availableModels.huggingface.models.length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600 mb-2">
                          Select a model ({availableModels.huggingface.models.length} working models):
                        </p>
                        <div className="space-y-2">
                          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                            {availableModels.huggingface.models.map((model, index) => {
                              const isSelected = selectedModel.provider === 'huggingface' && selectedModel.model === model;
                              const modelKey = `huggingface:${model}`;
                              const testResult = modelTestResults[modelKey];
                              return (
                                <div key={index} className="flex-shrink-0 flex flex-col gap-1">
                                  <button
                                    onClick={() => setSelectedModel({ provider: 'huggingface', model })}
                                    className={`
                                      px-4 py-2 rounded-lg font-mono text-sm transition-all relative
                                      ${isSelected
                                        ? 'bg-primary-600 text-white shadow-md transform scale-105'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }
                                    `}
                                  >
                                    {model}
                                    {isAdmin && testResult?.success && (
                                      <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500 bg-white rounded-full" />
                                    )}
                                    {isAdmin && testResult?.success === false && (
                                      <XCircle className="absolute -top-1 -right-1 h-4 w-4 text-red-500 bg-white rounded-full" />
                                    )}
                                  </button>
                                  {isAdmin && (
                                    <button
                                      onClick={() => testModel('huggingface', model)}
                                      disabled={testResult?.testing}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 flex items-center justify-center gap-1"
                                    >
                                      {testResult?.testing ? (
                                        <>
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                          Testing...
                                        </>
                                      ) : testResult?.success ? (
                                        <>
                                          <CheckCircle className="h-3 w-3" />
                                          Working
                                        </>
                                      ) : testResult?.success === false ? (
                                        <>
                                          <XCircle className="h-3 w-3" />
                                          Failed
                                        </>
                                      ) : (
                                        'Test'
                                      )}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {isAdmin && Object.entries(modelTestResults)
                            .filter(([key]) => key.startsWith('huggingface:'))
                            .map(([key, result]) => {
                              if (result.testing || result.success) return null;
                              const model = key.replace('huggingface:', '');
                              return (
                                <div key={key} className="bg-red-50 border border-red-200 rounded-lg p-2 text-xs">
                                  <p className="font-mono text-red-800">{model}</p>
                                  <p className="text-red-600">{result.error}</p>
                                </div>
                              );
                            })}
                        </div>
                        {selectedModel.provider === 'huggingface' && selectedModel.model && (
                          <div className="bg-primary-50 border border-primary-200 rounded-lg p-3">
                            <p className="text-sm font-semibold text-primary-900 mb-1">
                              Selected Model:
                            </p>
                            <p className="text-sm text-primary-700 font-mono">
                              {selectedModel.model}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : availableModels.huggingface.error ? (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                        <p className="font-semibold mb-1">Error:</p>
                        <p>{availableModels.huggingface.error}</p>
                        <p className="text-xs mt-2 text-red-600">
                          Please check your API key in Settings and try again.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                        <p>No models found. This might be a temporary issue. Please try again later.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 mb-2">
                      No Hugging Face API key configured.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowModelsModal(false);
                        window.location.href = '/dashboard/settings';
                      }}
                    >
                      Go to Settings
                    </Button>
                  </div>
                )}
              </div>

            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
              {selectedModel.model && (
                <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Selected Model:</p>
                  <p className="text-sm font-semibold text-blue-900 font-mono">
                    {selectedModel.provider === 'google_gemini' ? 'Google Gemini' : 
                     selectedModel.provider === 'openai' ? 'OpenAI' : 
                     selectedModel.provider === 'huggingface' ? 'Hugging Face' : 'Unknown'}: {selectedModel.model}
                  </p>
                </div>
              )}
              <Button
                variant="primary"
                className={selectedModel.model ? 'flex-shrink-0' : 'w-full'}
                onClick={async () => {
                  if (selectedModel.model && selectedModel.provider) {
                    try {
                      await usersApi.saveSelectedModel(selectedModel.provider, selectedModel.model);
                      toast.success('Model saved successfully!');
                    } catch (error: any) {
                      toast.error('Failed to save model selection');
                      console.error('Failed to save model:', error);
                    }
                  }
                  setShowModelsModal(false);
                }}
              >
                {selectedModel.model ? 'Confirm & Close' : 'Close'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

