import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { UserRole, ContentType } from '@prisma/client';
import { NotificationService } from '../notifications/notification.service';
import OpenAI from 'openai';
import axios, { AxiosError } from 'axios';
// Try to import @huggingface/inference if available
let HfInference: any = null;
try {
  HfInference = require('@huggingface/inference');
  console.log('✅ @huggingface/inference library loaded successfully');
} catch (e) {
  console.log('⚠️ @huggingface/inference not installed or failed to load:', e.message);
  console.log('⚠️ Will use direct API calls via router endpoints (limited model support)');
}
// Try to import @gradio/client for Spaces API (ES module, use dynamic import)
let GradioClient: any = null;
let GradioClientModule: any = null;
// Note: @gradio/client is an ES module, so we need to use dynamic import
// We'll load it when needed in the generateVideo method
console.log('ℹ️ Video generation will use @gradio/client (will load on first use)');

@Injectable()
export class AiService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notificationService: NotificationService,
  ) {
    console.log('✅ AI Service initialized - Using user-specific API keys');
  }

  // Removed generateSeoArticle, generateReelScript, getSampleSeoContent, getSampleReelContent, generateWithGoogleGemini
  // System now focuses on image generation only

  async generateImage(userId: string, prompt: string) {
    // Get user with all required fields
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check role permissions
    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Please sign up to use AI features');
    }

    // Check if FREE plan - return sample only
    if (user.role === UserRole.FREE) {
      return {
        imageUrl: 'https://via.placeholder.com/1024x1024?text=Sample+Image',
        isSample: true,
        message: 'This is a sample. Upgrade to generate real AI images.',
      };
    }

    // Check credits (use SEO credits for images)
    if (user.seoCredits < 1) {
      throw new BadRequestException('Insufficient credits. Please upgrade your plan.');
    }

    // Get user's API keys and selected models
    const googleGeminiApiKey = (user as any).googleGeminiApiKey;
    const openaiApiKey = (user as any).openaiApiKey;
    const huggingfaceApiKey = (user as any).huggingfaceApiKey;
    const selectedGeminiModel = (user as any).selectedGeminiModel;
    const selectedOpenAIModel = (user as any).selectedOpenAIModel;
    const selectedHuggingfaceModel = (user as any).selectedHuggingfaceModel;

    // Check if user has any API key configured
    if (!googleGeminiApiKey && !openaiApiKey && !huggingfaceApiKey) {
      return {
        imageUrl: 'https://via.placeholder.com/1024x1024?text=No+API+Key',
        isSample: true,
        message: '⚠️ No API key configured. Please add your API key in Settings.',
      };
    }

    try {
      // Try providers in order: Google Imagen -> OpenAI DALL-E -> Hugging Face
      let imageUrl: string | null = null;
      let lastError: string = '';
      let usedProvider: string = '';

      // Try Google Imagen API first (if Gemini API key is available)
      if (googleGeminiApiKey) {
        try {
          console.log('🎨 Attempting Google Imagen generation...');
          imageUrl = await this.generateImageWithImagen(prompt, googleGeminiApiKey);
          usedProvider = 'google-imagen';
          console.log('✅ Google Imagen generation successful!');
        } catch (error: any) {
          lastError = `Google Imagen: ${error.message}`;
          console.warn('⚠️ Google Imagen generation failed:', error.message);
          console.log('🔄 Falling back to next provider...');
        }
      }

      // Try OpenAI DALL-E if Imagen failed or not available
      if (!imageUrl && openaiApiKey) {
        try {
          console.log('🎨 Attempting OpenAI DALL-E generation...');
          imageUrl = await this.generateImageWithOpenAI(prompt, openaiApiKey, selectedOpenAIModel);
          usedProvider = 'openai-dalle';
          console.log('✅ OpenAI DALL-E generation successful!');
        } catch (error: any) {
          lastError = `OpenAI DALL-E: ${error.message}`;
          console.warn('⚠️ OpenAI DALL-E generation failed:', error.message);
          console.log('🔄 Falling back to Hugging Face...');
        }
      }

      // Try Hugging Face if both failed or not available
      if (!imageUrl && huggingfaceApiKey) {
        try {
          console.log('🎨 Attempting Hugging Face generation...');
          imageUrl = await this.generateImageWithHuggingFace(prompt, huggingfaceApiKey, selectedHuggingfaceModel);
          usedProvider = 'huggingface';
          console.log('✅ Hugging Face generation successful!');
        } catch (error: any) {
          lastError = `Hugging Face: ${error.message}`;
          console.error('❌ Hugging Face generation failed:', error.message);
        }
      }

      if (!imageUrl) {
        throw new Error(lastError || 'Failed to generate image with available APIs');
      }

      // Determine which model was used
      const usedModel = usedProvider === 'google-imagen'
        ? 'imagen-3.0-generate-001'
        : usedProvider === 'openai-dalle'
        ? (selectedOpenAIModel || 'dall-e-3')
        : (selectedHuggingfaceModel || 'stabilityai/stable-diffusion-xl-base-1.0');

      // Deduct credits
      await this.usersService.deductCredits(userId, 'seo', 1);

      // Save to content library
      await this.prisma.content.create({
        data: {
          userId: userId,
          type: ContentType.SEO_ARTICLE, // Using SEO_ARTICLE type for images
          title: `Generated Image: ${prompt.substring(0, 50)}`,
          content: imageUrl,
          prompt: prompt,
          metadata: {
            type: 'image',
            model: usedModel,
            provider: usedProvider || (imageUrl.startsWith('data:') ? 'google-imagen' : 'openai-dalle'),
          },
        },
      });

      await this.notificationService.notifyImageGeneration({
        userEmail: user.email,
        prompt,
        model: usedModel,
        provider: usedProvider || 'unknown',
        imageUrl,
      });

      return {
        imageUrl,
        isSample: false,
      };
    } catch (error: any) {
      console.error('Image generation error:', error);
      throw new BadRequestException(error.message || 'Failed to generate image');
    }
  }

  // Generate image using Google Imagen API
  private async generateImageWithImagen(prompt: string, apiKey: string): Promise<string> {
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    try {
      console.log('🎨 Generating image with Google Imagen...');
      
      // Google Imagen API endpoint
      const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict';
      
      const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
          instances: [{
            prompt: prompt,
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_all',
          },
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API returned status ${response.status}`);
          }

          const data = await response.json();
          
      if (data.predictions && data.predictions[0] && data.predictions[0].bytesBase64Encoded) {
        // Convert base64 to data URL
        const base64Image = data.predictions[0].bytesBase64Encoded;
        return `data:image/png;base64,${base64Image}`;
      }

      throw new Error('Invalid response from Imagen API');
        } catch (error: any) {
      console.error('Google Imagen error:', error.message);
      
      // If Imagen API fails, it might not be available or the API key doesn't have access
      // Return a more helpful error message but don't block fallback
      if (error.message.includes('404') || error.message.includes('not found') || error.message.includes('403')) {
        throw new Error('Imagen API not available with this API key. Falling back to OpenAI DALL-E...');
      }
      
      throw error;
    }
  }

  // Generate image using OpenAI DALL-E
  private async generateImageWithOpenAI(prompt: string, apiKey: string, selectedModel?: string | null): Promise<string> {
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      console.log('🎨 Generating image with OpenAI DALL-E...');
      
      const OpenAI = require('openai');
      const openai = new OpenAI({
        apiKey: apiKey,
      });

      // Use selected model if it's a DALL-E model, otherwise use default
      const model = selectedModel && selectedModel.includes('dall') ? selectedModel : 'dall-e-3';
      console.log(`🎯 Using model: ${model}`);

      const response = await openai.images.generate({
        model: model,
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      });

      if (response.data && response.data[0] && response.data[0].url) {
        return response.data[0].url;
      }

      throw new Error('Invalid response from DALL-E');
    } catch (error: any) {
      console.error('OpenAI DALL-E error:', error.message);
      throw error;
    }
  }

  // Generate image using Hugging Face API
  private async generateImageWithHuggingFace(prompt: string, apiKey: string, selectedModel?: string | null): Promise<string> {
    if (!apiKey) {
      throw new Error('Hugging Face API key not configured');
    }

    try {
      console.log('🎨 Generating image with Hugging Face...');
      
      // Use selected model if available, otherwise use default Stable Diffusion model
      // Handle deprecated model names
      let model = selectedModel || 'stabilityai/stable-diffusion-xl-base-1.0';
      
      // Replace deprecated or non-working model names with working alternatives
      if (model === 'runwayml/stable-diffusion-v1-5' || 
          model === 'sd-legacy/stable-diffusion-v1-5' || 
          model === 'stable-diffusion-v1-5/stable-diffusion-v1-5') {
        console.log(`⚠️ Model "${model}" is not available through router endpoints (404 error)`);
        console.log('⚠️ Falling back to "stabilityai/stable-diffusion-xl-base-1.0" which is known to work');
        model = 'stabilityai/stable-diffusion-xl-base-1.0';
      }
      
      console.log(`🎯 Using model: ${model}`);

      // Try using @huggingface/inference library first (if installed)
      if (HfInference) {
        try {
          console.log('📦 Using @huggingface/inference library...');
          
          // Check if HfInference is a class or has a default export
          const HfInferenceClass = HfInference.HfInference || HfInference.default || HfInference;
          const hf = new HfInferenceClass(apiKey);
          
          // Try textToImage method with timeout
          const imageBlob = await Promise.race([
            hf.textToImage({
              model: model,
              inputs: prompt,
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Library request timeout (60s)')), 60000)
            )
          ]) as Blob;

          // Convert blob to base64 data URL
          const arrayBuffer = await imageBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Image = buffer.toString('base64');
          
          console.log('✅ Successfully generated image using @huggingface/inference library');
          return `data:image/png;base64,${base64Image}`;
        } catch (libraryError: any) {
          const errorMsg = libraryError.message || 'Unknown error';
          const errorDetails = libraryError.httpResponse?.body?.error || libraryError.httpResponse?.status || '';
          
          // Check if it's a quota/limit error
          if (errorMsg.includes('usage limit') || errorMsg.includes('quota') || libraryError.httpResponse?.status === 402) {
            throw new Error(`Hugging Face API quota exceeded: ${errorDetails || errorMsg}. Please use a different API key or wait for quota reset.`);
          }
          
          console.log('⚠️ @huggingface/inference library failed, falling back to direct API calls:', errorMsg);
          console.log('Library error details:', libraryError);
          
          // If it's a critical error (not just a model issue), throw it
          if (libraryError.httpResponse?.status === 401 || libraryError.httpResponse?.status === 403) {
            throw new Error(`Hugging Face API authentication failed: ${errorDetails || errorMsg}`);
          }
        }
      } else {
        console.log('⚠️ @huggingface/inference library not available, using direct API calls');
      }

      // Fallback to direct API calls using axios (more reliable than fetch)
      // Try multiple endpoint formats since router endpoint might not work for all models
      let response: any = null;
      let lastError: string = '';
      
      // Option 1: Try router endpoint with /v1/models/ using axios
      try {
        console.log('🔄 Trying router endpoint (/v1/models/) with axios...');
        response = await axios.post(
          `https://router.huggingface.co/v1/models/${model}`,
          { inputs: prompt },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 60000, // 60 second timeout
            responseType: 'arraybuffer', // For image data
          }
        );
        
        if (response.status === 200) {
          console.log('✅ Successfully used router endpoint (/v1/models/)');
        }
      } catch (routerError: any) {
        if (axios.isAxiosError(routerError)) {
          if (routerError.code === 'ECONNABORTED') {
            console.log('⚠️ Router endpoint (/v1/models/) timeout');
            lastError = 'Request timeout (60s)';
          } else if (routerError.response?.status === 404) {
            console.log('⚠️ Router endpoint (/v1/models/) returned 404, trying alternative...');
            lastError = `Router /v1/models/: 404`;
          } else {
            console.log('⚠️ Router endpoint (/v1/models/) failed:', routerError.message);
            lastError = routerError.message || 'Network error';
          }
        } else {
          console.log('⚠️ Router endpoint (/v1/models/) failed:', routerError.message);
          lastError = routerError.message || 'Network error';
        }
        response = null;
      }
      
      // Option 2: Try router endpoint without /v1/ using axios
      if (!response || response.status !== 200) {
        try {
          console.log('🔄 Trying router endpoint (without /v1/) with axios...');
          response = await axios.post(
            `https://router.huggingface.co/models/${model}`,
            { inputs: prompt },
            {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              timeout: 60000,
              responseType: 'arraybuffer',
            }
          );
          
          if (response.status === 200) {
            console.log('✅ Successfully used router endpoint (without /v1/)');
          }
        } catch (altError: any) {
          if (axios.isAxiosError(altError)) {
            if (altError.code === 'ECONNABORTED') {
              console.log('⚠️ Router endpoint (without /v1/) timeout');
              lastError = 'Request timeout (60s)';
            } else {
              console.log('⚠️ Router endpoint (without /v1/) also failed:', altError.message);
              lastError = altError.message || 'Network error';
            }
          } else {
            console.log('⚠️ Router endpoint (without /v1/) also failed:', altError.message);
            lastError = altError.message || 'Network error';
          }
          response = null;
        }
      }
      
      // Note: Removed hf-inference endpoint as it causes DNS errors (ENOTFOUND)
      // Using only router endpoints which are more reliable
      
      // If all endpoints failed, throw error with helpful message
      if (!response || response.status !== 200) {
        // Handle model loading (503 status)
        if (response?.status === 503) {
          const loadingInfo = response.data ? JSON.parse(Buffer.from(response.data).toString()) : {};
          throw new Error(`Model is loading. Please wait ${loadingInfo.estimated_time || 'a few'} seconds and try again.`);
        }
        
        // Handle 404 - model not found or not available
        if (response?.status === 404) {
          throw new Error(`Model "${model}" is not available through Hugging Face router endpoints (404). 

This model might not be supported by the router API. Some models only work with the @huggingface/inference library, not with direct router endpoints.

Recommended solution:
- Use one of these confirmed working models:
  - "stabilityai/stable-diffusion-xl-base-1.0" (Stable Diffusion XL)
  - "black-forest-labs/FLUX.1-dev" (FLUX.1 [dev] - high quality)
  - "black-forest-labs/FLUX.1-schnell" (FLUX.1 [schnell] - fast generation)
- Or ensure the @huggingface/inference library is properly installed and the backend server is restarted

Note: These models work with the @huggingface/inference library method. Router endpoints have limited support.`);
        }
        
        // Provide more helpful error message
        if (lastError.includes('timeout') || lastError.includes('ECONNREFUSED') || lastError.includes('ENOTFOUND') || lastError.includes('Network error') || lastError.includes('ECONNABORTED')) {
          // Check if it's a DNS error
          if (lastError.includes('ENOTFOUND')) {
            throw new Error(`Hugging Face API request failed: DNS resolution error (${lastError}). 

The model "${model}" might not be available through the router endpoints, or there's a network connectivity issue.

Solutions:
1. Use "stabilityai/stable-diffusion-xl-base-1.0" which is the only model confirmed to work
2. Try using the @huggingface/inference library method (restart backend server if needed)
3. Check your internet connection and firewall settings
4. Verify your API key is correct and has proper permissions
5. Wait a few minutes and try again (the model might be loading)

Note: Only "stabilityai/stable-diffusion-xl-base-1.0" is confirmed to work with router endpoints.`);
          }
          
          throw new Error(`Hugging Face API request failed: ${lastError}. 

This might be caused by:
1. Network connectivity issues (firewall, proxy, or internet connection)
2. The model "${model}" is not available through the current API endpoints
3. API key permissions or validity issues

Solutions:
1. Use "stabilityai/stable-diffusion-xl-base-1.0" which is the only model confirmed to work
2. The @huggingface/inference library is already installed - restart your backend server to ensure it's loaded
3. Check your internet connection and firewall settings
4. Verify your API key is correct and has proper permissions
5. Wait a few minutes and try again (the model might be loading)

Note: Only "stabilityai/stable-diffusion-xl-base-1.0" is confirmed to work with router endpoints.`);
        }
        
        const errorMsg = response?.data ? (typeof response.data === 'string' ? response.data : JSON.stringify(response.data)) : `API returned status ${response?.status || 'unknown'}`;
        throw new Error(`Hugging Face API error: ${errorMsg}. The model "${model}" might not be available. All endpoints tried failed. Last attempt: ${lastError}`);
      }

      // Parse response (axios returns data directly as arraybuffer)
      const imageBuffer = response.data;
      const buffer = Buffer.from(imageBuffer);
      const base64Image = buffer.toString('base64');
      
      console.log('✅ Successfully generated image with Hugging Face');
      return `data:image/png;base64,${base64Image}`;
    } catch (error: any) {
      console.error('Hugging Face error:', error.message);
      throw error;
    }
  }

  // Generate video using Hugging Face API
  async generateVideo(userId: string, prompt: string) {
    // Get user with all required fields
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check role permissions
    if (user.role === UserRole.GUEST) {
      throw new ForbiddenException('Please sign up to use AI features');
    }

    // Check if FREE plan - return sample only
    if (user.role === UserRole.FREE) {
      return {
        videoUrl: 'https://via.placeholder.com/512x512?text=Sample+Video',
        isSample: true,
        message: 'This is a sample. Upgrade to generate real AI videos.',
      };
    }

    // Check credits (use SEO credits for videos)
    if (user.seoCredits < 1) {
      throw new BadRequestException('Insufficient credits. Please upgrade your plan.');
    }

    // Get user's API keys and selected models
    const huggingfaceApiKey = (user as any).huggingfaceApiKey;
    const selectedHuggingfaceModel = (user as any).selectedHuggingfaceModel;

    // Check if user has Hugging Face API key configured
    if (!huggingfaceApiKey) {
      return {
        videoUrl: 'https://via.placeholder.com/512x512?text=No+API+Key',
        isSample: true,
        message: '⚠️ No Hugging Face API key configured. Please add your API key in Settings.',
      };
    }

    try {
      // Use Gradio HTTP API directly (no client library needed)
      // This avoids ES module import issues in CommonJS
      console.log('🎬 Video generation using Gradio HTTP API (no client library needed)');

      // Get user's API keys for image generation (we need an image first)
      const googleGeminiApiKey = (user as any).googleGeminiApiKey;
      const openaiApiKey = (user as any).openaiApiKey;
      const huggingfaceApiKey = (user as any).huggingfaceApiKey;

      // First, generate an image from the prompt (if we don't have one)
      let inputImage: string | null = null;
      let lastError: string = '';
      const errors: string[] = [];
      
      try {
        console.log('🎨 Generating image first for video generation...');
        console.log('📋 Available API keys:', {
          googleGemini: !!googleGeminiApiKey,
          openai: !!openaiApiKey,
          huggingface: !!huggingfaceApiKey,
        });
        
        // Try to generate image using available providers
        if (googleGeminiApiKey) {
          try {
            console.log('🔄 Trying Google Imagen...');
            inputImage = await this.generateImageWithImagen(prompt, googleGeminiApiKey);
            console.log('✅ Image generated using Google Imagen');
          } catch (e: any) {
            const errorMsg = e.message || 'Unknown error';
            errors.push(`Google Imagen: ${errorMsg}`);
            console.log(`⚠️ Google Imagen failed: ${errorMsg}`);
            lastError = errorMsg;
          }
        } else {
          console.log('⚠️ Google Gemini API key not configured, skipping Imagen');
        }
        
        if (!inputImage && openaiApiKey) {
          try {
            console.log('🔄 Trying OpenAI DALL-E...');
            inputImage = await this.generateImageWithOpenAI(prompt, openaiApiKey);
            console.log('✅ Image generated using OpenAI DALL-E');
          } catch (e: any) {
            const errorMsg = e.message || 'Unknown error';
            errors.push(`OpenAI DALL-E: ${errorMsg}`);
            console.log(`⚠️ OpenAI DALL-E failed: ${errorMsg}`);
            lastError = errorMsg;
          }
        } else if (!inputImage) {
          console.log('⚠️ OpenAI API key not configured, skipping DALL-E');
        }
        
        if (!inputImage && huggingfaceApiKey) {
          try {
            console.log('🔄 Trying Hugging Face...');
            inputImage = await this.generateImageWithHuggingFace(prompt, huggingfaceApiKey);
            console.log('✅ Image generated using Hugging Face');
          } catch (e: any) {
            const errorMsg = e.message || 'Unknown error';
            errors.push(`Hugging Face: ${errorMsg}`);
            console.log(`⚠️ Hugging Face failed: ${errorMsg}`);
            lastError = errorMsg;
          }
        } else if (!inputImage) {
          console.log('⚠️ Hugging Face API key not configured, skipping');
        }
        
        if (!inputImage) {
          const errorDetails = errors.length > 0 
            ? `\n\nErrors encountered:\n${errors.map(e => `- ${e}`).join('\n')}`
            : '';
          
          const missingKeys = [];
          if (!googleGeminiApiKey) missingKeys.push('Google Gemini (for Imagen)');
          if (!openaiApiKey) missingKeys.push('OpenAI (for DALL-E)');
          if (!huggingfaceApiKey) missingKeys.push('Hugging Face (for Stable Diffusion)');
          
          const missingKeysMsg = missingKeys.length > 0
            ? `\n\nMissing API keys:\n${missingKeys.map(k => `- ${k}`).join('\n')}`
            : '';
          
          throw new BadRequestException(`Failed to generate image for video generation.${errorDetails}${missingKeysMsg}

The video generation requires an image as input. Please:
1. Configure at least one API key in Settings
2. Ensure your API keys are valid and have available credits/quota
3. Try again`);
        }
      } catch (error: any) {
        // If it's already a BadRequestException, rethrow it
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Failed to generate input image: ${error.message}`);
      }

      // Convert image to Buffer for Gradio Client (Node.js environment)
      let imageBuffer: Buffer;
      if (inputImage.startsWith('data:image/')) {
        // Base64 image
        const base64Data = inputImage.split(',')[1];
        imageBuffer = Buffer.from(base64Data, 'base64');
      } else {
        // URL image - fetch it
        const response = await axios.get(inputImage, { responseType: 'arraybuffer' });
        imageBuffer = Buffer.from(response.data);
      }

      // Use Gradio HTTP API directly (no client library needed)
      console.log('🎬 Generating video using Gradio HTTP API (Dream-wan2-2-faster-Pro)...');
      
      const spaceName = 'dream2589632147/Dream-wan2-2-faster-Pro';
      const spaceSlug = spaceName.replace('/', '-');
      const apiUrl = `https://${spaceSlug}.hf.space/api/predict`;
      
      console.log('📡 Calling Gradio API:', apiUrl);
      
      // Convert image buffer to base64 data URL
      const imageBase64 = imageBuffer.toString('base64');
      const imageDataUrl = `data:image/png;base64,${imageBase64}`;
      
      // Prepare JSON payload for Gradio API
      // According to Gradio API docs, the format is: { data: [inputs...] }
      const requestPayload = {
        data: [
          imageDataUrl, // input_image (0)
          prompt || 'Make this image come alive with dynamic, cinematic human motion. Create smooth, natural, lifelike animation with fluid transitions, expressive body movement, realistic physics, and elegant camera flow.', // prompt (1)
          6, // steps (2)
          'low quality, worst quality, motion artifacts, unstable motion, jitter, frame jitter, wobbling limbs, motion distortion, inconsistent movement, robotic movement', // negative_prompt (3)
          3.5, // duration_seconds (4)
          1, // guidance_scale (5)
          1, // guidance_scale_2 (6)
          Math.floor(Math.random() * 1000000), // seed (7)
          true, // randomize_seed (8)
        ],
      };
      
      console.log('📦 Sending request to Gradio API...');
      
      // Call Gradio API with JSON payload
      const response = await axios.post(apiUrl, requestPayload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 300000, // 5 minutes timeout
      });
      
      console.log('📥 Received response from Gradio API');
      const result = response.data;
      const videoUrl = result?.data?.[0];
      
      if (!videoUrl) {
        throw new Error('No video returned from Gradio API');
      }

      console.log('✅ Video generated successfully!');

      // Deduct credits
      await this.usersService.deductCredits(userId, 'seo', 1);

      // Save to content library
      await this.prisma.content.create({
        data: {
          userId: userId,
          type: ContentType.REEL_SCRIPT, // Using REEL_SCRIPT type for videos
          title: `Generated Video: ${prompt.substring(0, 50)}`,
          content: videoUrl,
          prompt: prompt,
          metadata: {
            type: 'video',
            model: 'dream2589632147/Dream-wan2-2-faster-Pro',
            provider: 'gradio-spaces',
          },
        },
      });

      return {
        videoUrl,
        isSample: false,
      };

      /* Legacy code (commented out - using Gradio Client instead)
      // Use selected model if available, otherwise use default video model
      let model = selectedHuggingfaceModel || 'damo-vilab/text-to-video-ms-1.7b';
      
      // Only use video models
      const videoModels = [
        'damo-vilab/text-to-video-ms-1.7b',
        'cerspense/zeroscope-v2-xl',
        'damo-vilab/modelscope-damo-text-to-video-synthesis',
      ];
      if (!videoModels.includes(model)) {
        model = 'damo-vilab/text-to-video-ms-1.7b';
        console.log(`⚠️ Selected model is not a video model, using default: ${model}`);
      }

      console.log(`🎬 Generating video with model: ${model}`);

      // Try using @huggingface/inference library first
      let videoUrl: string | null = null;
      
      if (HfInference) {
        try {
          console.log('📦 Using @huggingface/inference library for video generation...');
          
          const HfInferenceClass = HfInference.HfInference || HfInference.default || HfInference;
          const hf = new HfInferenceClass(huggingfaceApiKey);
          
          // Try textToVideo method (if available in the library)
          // Note: @huggingface/inference library may have textToVideo method
          let videoBlob: Blob;
          
          if (hf.textToVideo) {
            // Use textToVideo method if available
            videoBlob = await Promise.race([
              hf.textToVideo({
                model: model,
                inputs: prompt,
              }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Video generation timeout (120s)')), 120000)
              )
            ]);
          } else {
            // Fallback to request method
            videoBlob = await Promise.race([
              hf.request({
                model: model,
                inputs: prompt,
              }),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Video generation timeout (120s)')), 120000)
              )
            ]) as Blob;
          }

          // Convert blob to base64 data URL
          const arrayBuffer = await videoBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const base64Video = buffer.toString('base64');
          
          videoUrl = `data:video/mp4;base64,${base64Video}`;
          console.log('✅ Successfully generated video using @huggingface/inference library');
        } catch (libraryError: any) {
          console.log('⚠️ @huggingface/inference library failed, trying direct API calls:', libraryError.message);
        }
      }

      // Fallback to direct API calls
      if (!videoUrl) {
        // Try multiple endpoints for video generation
        const endpoints = [
          `https://api-inference.huggingface.co/models/${model}`,
          `https://router.huggingface.co/v1/models/${model}`,
          `https://router.huggingface.co/models/${model}`,
        ];
        
        let lastError: any = null;
        
        for (const endpoint of endpoints) {
          try {
            console.log(`🔄 Trying endpoint: ${endpoint}...`);
            
            const response = await axios.post(
              endpoint,
              { inputs: prompt },
              {
                headers: {
                  'Authorization': `Bearer ${huggingfaceApiKey}`,
                  'Content-Type': 'application/json',
                },
                timeout: 120000, // 120 second timeout for video
                responseType: 'arraybuffer',
              }
            );

            if (response.status === 200) {
              const videoBuffer = response.data;
              const buffer = Buffer.from(videoBuffer);
              const base64Video = buffer.toString('base64');
              videoUrl = `data:video/mp4;base64,${base64Video}`;
              console.log(`✅ Successfully generated video via ${endpoint}`);
              break;
            }
          } catch (apiError: any) {
            console.log(`⚠️ Endpoint ${endpoint} failed:`, apiError.message);
            lastError = apiError;
            
            // If 404, try next endpoint
            if (axios.isAxiosError(apiError) && apiError.response?.status === 404) {
              continue;
            }
            
            // If 503 (model loading), throw immediately
            if (axios.isAxiosError(apiError) && apiError.response?.status === 503) {
              const loadingInfo = apiError.response?.data ? 
                (typeof apiError.response.data === 'string' ? 
                  JSON.parse(apiError.response.data) : 
                  apiError.response.data) : {};
              throw new Error(`Model is loading. Please wait ${loadingInfo.estimated_time || 'a few'} seconds and try again.`);
            }
          }
        }
        
        // If all endpoints failed
        if (!videoUrl) {
          if (lastError && axios.isAxiosError(lastError)) {
            const status = lastError.response?.status;
            const statusText = lastError.response?.statusText;
            
            if (status === 404) {
              throw new Error(`Video generation failed: Model "${model}" not found or not available through the API. 

This might be because:
1. The model "${model}" is a Space and may not support text-to-video through inference API
2. The model doesn't support text-to-video generation
3. Your API key doesn't have access to this model

Recommended video models that work with Inference API:
- "damo-vilab/text-to-video-ms-1.7b" (ModelScope Text-to-Video)
- "cerspense/zeroscope-v2-xl" (ZeroScope v2 XL)

Please check the model's documentation or try using one of the recommended models above.`);
            } else {
              throw new Error(`Video generation failed: ${statusText || lastError.message} (Status: ${status || 'unknown'})`);
            }
          } else {
            throw new Error(`Video generation failed: ${lastError?.message || 'All endpoints failed'}`);
          }
        }
      }

      if (!videoUrl) {
        throw new Error('Failed to generate video with available methods');
      }

      // Deduct credits
      await this.usersService.deductCredits(userId, 'seo', 1);

      // Save to content library
      await this.prisma.content.create({
        data: {
          userId: userId,
          type: ContentType.REEL_SCRIPT, // Using REEL_SCRIPT type for videos
          title: `Generated Video: ${prompt.substring(0, 50)}`,
          content: videoUrl,
          prompt: prompt,
          metadata: {
            type: 'video',
            model: model,
            provider: 'huggingface',
          },
        },
      });

      return {
        videoUrl,
        isSample: false,
      };
      */
    } catch (error: any) {
      console.error('Video generation error:', error);
      throw new BadRequestException(error.message || 'Failed to generate video');
    }
  }

  // Removed generateWithOpenAI - was only used for text generation (SEO/Reel), not needed for image generation
}

