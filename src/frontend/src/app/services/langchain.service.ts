import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LangChainConfig, DEFAULT_CONFIG, ProviderConfig, DEFAULT_PROVIDERS, LLMProvider } from '../models/langchain-config';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { invoke } from '@tauri-apps/api/core';

/**
 * Service for interacting with LangChain
 */
@Injectable({
  providedIn: 'root'
})
export class LangChainService {
  private configSubject = new BehaviorSubject<LangChainConfig>(DEFAULT_CONFIG);
  private providersSubject = new BehaviorSubject<ProviderConfig[]>(DEFAULT_PROVIDERS);

  /**
   * Observable for the current LangChain configuration
   */
  public config$: Observable<LangChainConfig> = this.configSubject.asObservable();

  /**
   * Observable for the available providers
   */
  public providers$: Observable<ProviderConfig[]> = this.providersSubject.asObservable();

  constructor() {
    // Load saved configuration from storage if available
    this.loadConfig().catch(error => {
      console.error('Error in loadConfig during initialization:', error);
    });
  }

  /**
   * Get the current LangChain configuration
   */
  public getConfig(): LangChainConfig {
    return this.configSubject.getValue();
  }

  /**
   * Update the LangChain configuration
   * @param config The new configuration
   */
  public async updateConfig(config: Partial<LangChainConfig>): Promise<void> {
    const currentConfig = this.configSubject.getValue();
    const newConfig = { ...currentConfig, ...config };

    // If API key is being cleared, delete it from the keyring
    if (config.hasOwnProperty('apiKey') && !config.apiKey && currentConfig.provider) {
      await this.deleteApiKey(currentConfig.provider).catch(error => {
        console.warn('Failed to delete API key from keyring:', error);
      });
    }

    this.configSubject.next(newConfig);
    await this.saveConfig(newConfig).catch(error => {
      console.error('Error saving configuration:', error);
    });
  }

  /**
   * Delete an API key from the keyring
   * @param provider The provider whose API key should be deleted
   */
  private async deleteApiKey(provider: string): Promise<void> {
    try {
      await invoke('delete_api_key', { provider });
    } catch (error) {
      console.error(`Failed to delete API key for provider ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Get the available providers
   */
  public getProviders(): ProviderConfig[] {
    return this.providersSubject.getValue();
  }

  /**
   * Get the available models for a provider
   * @param provider The provider to get models for
   */
  public getModelsForProvider(provider: LLMProvider): any[] {
    const providerConfig = this.providersSubject.getValue().find(p => p.id === provider);
    return providerConfig ? providerConfig.models : [];
  }

  /**
   * Process text using LangChain
   * @param text The text to process
   * @param options Additional processing options
   */
  public async fixTextSilent(text: string, options?: any): Promise<string> {
    try {
      console.log('Processing text with LangChain', {
        text,
        options,
        config: this.getConfig()
      });

      const config = this.getConfig();

      if (!config.apiKey) {
        console.error('API key is not set');
        return text;
      }

      // Load the prompt from SilentFix.md
      const promptTemplate = ChatPromptTemplate.fromTemplate(
`You are a grammar and spelling correction assistant. Your task is to fix grammatical errors, spelling mistakes, and improve clarity in text while preserving the original meaning, tone, and intent.

Rules:
1. Correct all grammar and spelling errors
2. Preserve the original meaning and factual content exactly
3. Maintain the author's voice, tone, and perspective
4. Keep the original language - never translate
5. Improve sentence structure only when necessary for clarity
6. Make direct corrections without explanations, comments, or questions
7. Focus on making the text more professional and readable while keeping it authentic

Text to fix: {text}`
      );

      // Create the model based on the provider
      let model;
      if (config.provider === LLMProvider.OPENAI) {
        model = new ChatOpenAI({
          modelName: config.model,
          openAIApiKey: config.apiKey,
          temperature: 0.1, // Low temperature for more deterministic outputs
        });
      } else if (config.provider === LLMProvider.ANTHROPIC) {
        model = new ChatAnthropic({
          modelName: config.model,
          anthropicApiKey: config.apiKey,
          temperature: 0.1, // Low temperature for more deterministic outputs
        });
      } else {
        throw new Error(`Unsupported provider: ${config.provider}`);
      }

      // Create the chain with a string output parser
      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

      // Invoke the chain
      const processedText = await chain.invoke({
        text: text
      });

      return processedText;
    } catch (error) {
      console.error('Error processing text with LangChain', error);
      // Return the original text if there's an error
      return text;
    }
  }

  /**
   * Load the LangChain configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      // Check for old config format in localStorage (for migration)
      const oldConfig = localStorage.getItem('langchain_config');

      // Load non-sensitive config from localStorage
      const savedConfig = localStorage.getItem('langchain_config_nonsensitive');
      let config = DEFAULT_CONFIG;

      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        config = { ...config, ...parsedConfig };
      } else if (oldConfig) {
        // Migrate from old format
        try {
          const parsedOldConfig = JSON.parse(oldConfig);
          config = { ...config, ...parsedOldConfig };

          // Store API key in keyring if available
          if (parsedOldConfig.provider && parsedOldConfig.apiKey) {
            await this.migrateApiKey(parsedOldConfig.provider, parsedOldConfig.apiKey);
          }

          // Save non-sensitive config in new format
          const nonsensitiveConfig = { ...parsedOldConfig };
          // Use type assertion to allow setting apiKey to undefined
          (nonsensitiveConfig as Partial<LangChainConfig>).apiKey = undefined;
          localStorage.setItem('langchain_config_nonsensitive', JSON.stringify(nonsensitiveConfig));

          // Remove old config
          localStorage.removeItem('langchain_config');
        } catch (migrationError) {
          console.error('Error migrating from old config format:', migrationError);
        }
      }

      // Load API key from keyring if provider is set
      if (config.provider) {
        try {
          const apiKey = await invoke<string>('get_api_key', { provider: config.provider });
          if (apiKey) {
            config.apiKey = apiKey;
          }
        } catch (keyringError) {
          console.warn('Could not load API key from keyring:', keyringError);
          // Continue without API key
        }
      }

      this.configSubject.next(config);
    } catch (error) {
      console.error('Error loading LangChain configuration', error);
    }
  }

  /**
   * Migrate an API key from localStorage to keyring
   * @param provider The provider
   * @param apiKey The API key to migrate
   */
  private async migrateApiKey(provider: string, apiKey: string): Promise<void> {
    try {
      await invoke('store_api_key', { provider, apiKey });
      console.log(`Successfully migrated API key for ${provider} to keyring`);
    } catch (error) {
      console.error(`Failed to migrate API key for ${provider} to keyring:`, error);
      throw error;
    }
  }

  /**
   * Save the LangChain configuration to storage
   * @param config The configuration to save
   */
  private async saveConfig(config: LangChainConfig): Promise<void> {
    try {
      // Store API key in keyring if provider and key are set
      if (config.provider && config.apiKey) {
        try {
          await invoke('store_api_key', { 
            provider: config.provider, 
            apiKey: config.apiKey 
          });
        } catch (keyringError) {
          console.error('Failed to store API key in keyring:', keyringError);
        }
      }

      // Store non-sensitive config in localStorage (without API key)
      const nonsensitiveConfig = { ...config };
      // Use type assertion to allow deleting the apiKey property
      (nonsensitiveConfig as Partial<LangChainConfig>).apiKey = undefined;

      localStorage.setItem('langchain_config_nonsensitive', JSON.stringify(nonsensitiveConfig));
    } catch (error) {
      console.error('Error saving LangChain configuration', error);
    }
  }
}
