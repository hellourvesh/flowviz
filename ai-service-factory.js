/**
 * AI Service Factory - Unified interface for multiple AI providers
 * Supports both Anthropic Claude and OpenAI ChatGPT
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { logger } from '../src/shared/utils/logger.js';

export type AIProvider = 'anthropic' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  baseURL?: string;
  model?: string;
}

export interface VisionMessage {
  type: 'text' | 'image';
  text?: string;
  image?: {
    base64Data: string;
    mediaType: string;
  };
}

export interface StreamChunk {
  type: 'progress' | 'content' | 'error' | 'done';
  stage?: string;
  message?: string;
  text?: string;
  error?: string;
}

/**
 * Base AI Service Interface
 */
export interface AIService {
  provider: AIProvider;
  streamAnalysis(prompt: string, systemPrompt?: string): AsyncGenerator<StreamChunk>;
  visionAnalysis(messages: VisionMessage[], options?: { maxTokens?: number }): Promise<string>;
  getModelInfo(): { provider: string; model: string; supportsVision: boolean };
}

/**
 * Anthropic Claude Service Implementation
 */
class AnthropicService implements AIService {
  provider: AIProvider = 'anthropic';
  private client: Anthropic;
  private model: string;

  constructor(config: AIConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
    this.model = config.model || 'claude-sonnet-4-20250514';
  }

  async *streamAnalysis(prompt: string, systemPrompt?: string): AsyncGenerator<StreamChunk> {
    try {
      const stream = await this.client.messages.stream({
        model: this.model,
        max_tokens: 16000,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }],
        system: systemPrompt
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield {
            type: 'content',
            text: chunk.delta.text
          };
        }
      }

      yield { type: 'done' };
    } catch (error: any) {
      logger.error('Anthropic streaming error:', error);
      yield {
        type: 'error',
        error: error.message || 'Anthropic API error'
      };
    }
  }

  async visionAnalysis(messages: VisionMessage[], options?: { maxTokens?: number }): Promise<string> {
    const content: any[] = [];
    
    for (const msg of messages) {
      if (msg.type === 'text' && msg.text) {
        content.push({ type: 'text', text: msg.text });
      } else if (msg.type === 'image' && msg.image) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: msg.image.mediaType,
            data: msg.image.base64Data
          }
        });
      }
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 4000,
      temperature: 0.1,
      messages: [{ role: 'user', content }]
    });

    return response.content[0]?.type === 'text' ? response.content[0].text : '';
  }

  getModelInfo() {
    return {
      provider: 'Anthropic Claude',
      model: this.model,
      supportsVision: true
    };
  }
}

/**
 * OpenAI ChatGPT Service Implementation
 */
class OpenAIService implements AIService {
  provider: AIProvider = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(config: AIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL
    });
    this.model = config.model || 'gpt-4o';
  }

  async *streamAnalysis(prompt: string, systemPrompt?: string): AsyncGenerator<StreamChunk> {
    try {
      const messages: any[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      messages.push({ role: 'user', content: prompt });

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 16000,
        temperature: 0.1,
        stream: true
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield {
            type: 'content',
            text: content
          };
        }
      }

      yield { type: 'done' };
    } catch (error: any) {
      logger.error('OpenAI streaming error:', error);
      yield {
        type: 'error',
        error: error.message || 'OpenAI API error'
      };
    }
  }

  async visionAnalysis(messages: VisionMessage[], options?: { maxTokens?: number }): Promise<string> {
    const content: any[] = [];
    
    for (const msg of messages) {
      if (msg.type === 'text' && msg.text) {
        content.push({ type: 'text', text: msg.text });
      } else if (msg.type === 'image' && msg.image) {
        content.push({
          type: 'image_url',
          image_url: {
            url: `data:${msg.image.mediaType};base64,${msg.image.base64Data}`
          }
        });
      }
    }

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content }],
      max_tokens: options?.maxTokens || 4000,
      temperature: 0.1
    });

    return response.choices[0]?.message?.content || '';
  }

  getModelInfo() {
    return {
      provider: 'OpenAI ChatGPT',
      model: this.model,
      supportsVision: this.model.includes('gpt-4') || this.model === 'gpt-4o'
    };
  }
}

/**
 * AI Service Factory
 * Creates appropriate AI service based on configuration
 */
export class AIServiceFactory {
  static create(config: AIConfig): AIService {
    logger.info(`Creating AI service: ${config.provider} with model ${config.model || 'default'}`);
    
    switch (config.provider) {
      case 'anthropic':
        return new AnthropicService(config);
      case 'openai':
        return new OpenAIService(config);
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * Get AI configuration from environment variables
   */
  static getConfigFromEnv(provider?: AIProvider): AIConfig {
    const envProvider = (provider || process.env.AI_PROVIDER || 'anthropic') as AIProvider;
    
    if (envProvider === 'anthropic') {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
      }
      
      return {
        provider: 'anthropic',
        apiKey,
        baseURL: process.env.ANTHROPIC_BASE_URL,
        model: process.env.ANTHROPIC_MODEL
      };
    } else if (envProvider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      
      return {
        provider: 'openai',
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL,
        model: process.env.OPENAI_MODEL
      };
    }
    
    throw new Error(`Invalid AI provider: ${envProvider}`);
  }

  /**
   * Check if a provider is configured
   */
  static isProviderConfigured(provider: AIProvider): boolean {
    try {
      const config = this.getConfigFromEnv(provider);
      return !!config.apiKey;
    } catch {
      return false;
    }
  }

  /**
   * Get list of available providers
   */
  static getAvailableProviders(): AIProvider[] {
    const providers: AIProvider[] = [];
    
    if (process.env.ANTHROPIC_API_KEY) {
      providers.push('anthropic');
    }
    
    if (process.env.OPENAI_API_KEY) {
      providers.push('openai');
    }
    
    return providers;
  }
}
