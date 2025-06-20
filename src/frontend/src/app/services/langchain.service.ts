import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LangChainConfig, DEFAULT_CONFIG, ProviderConfig, DEFAULT_PROVIDERS, LLMProvider } from '../models/langchain-config';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { invoke } from '@tauri-apps/api/core';
import { BedrockChat } from "@langchain/community/chat_models/bedrock/web";
import dedent from "dedent";

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
   * Get a model instance based on the current configuration
   * @returns A model instance (ChatOpenAI, ChatAnthropic, or BedrockChat)
   */
  public async getModel(): Promise<ChatOpenAI | ChatAnthropic | BedrockChat> {
    const config = this.getConfig();
    if (!config.apiKey) {
      throw new Error('API key is not set');
    }

    if (config.provider === LLMProvider.OPENAI) {
      return new ChatOpenAI({
        model: config.model,
        openAIApiKey: config.apiKey,
        temperature: 0.1,
        onFailedAttempt: (error: any) => {
          console.error('OpenAI failed attempt:', error);
        }
      });
    } else if (config.provider === LLMProvider.ANTHROPIC) {
      return new ChatAnthropic({
        model: config.model,
        anthropicApiKey: config.apiKey,
        temperature: 0.1,
        onFailedAttempt: (error: any) => {
          console.error('Anthropic failed attempt:', error);
        }
      });
    } else if (config.provider === LLMProvider.AWS_BEDROCK) {

      //TODO: implement a more robust inference profile selection / untested with non anthropic models

      let inferenceProfile = config.providerConfig?.awsBedrock?.inferenceProfile;
      if (!inferenceProfile && config.providerConfig!.awsBedrock!.region) {
        if (config.providerConfig!.awsBedrock!.region.startsWith('us')) {
          inferenceProfile = `us.${config.model}`;
        } else if (config.providerConfig!.awsBedrock!.region.startsWith('eu')) {
          inferenceProfile = `eu.${config.model}`;
        } else if (config.providerConfig!.awsBedrock!.region.startsWith('ap')) {
          inferenceProfile = `apac.${config.model}`;
        }
        console.log("inferenceProfile ", inferenceProfile);
      }

      return new BedrockChat({
        model: config.model,
        applicationInferenceProfile:inferenceProfile, //string like eu.anthropic.claude-sonnet-4-20250514-v1:0
        region: config.providerConfig!.awsBedrock!.region,
        cache: config.providerConfig!.awsBedrock!.cache,
        credentials: {
          accessKeyId: config.providerConfig!.awsBedrock!.aws_access_key_id,
          secretAccessKey: config.providerConfig!.awsBedrock!.aws_secret_access_key,
          sessionToken: config.providerConfig!.awsBedrock!.aws_session_token
        },
        temperature: 0.1,
        onFailedAttempt: (error: any) => {
          console.error('Bedrock failed attempt:', error);
        }
      });
    } else {
      throw new Error(`Unsupported provider: ${config.provider}`);
    }
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
      const promptTemplate = ChatPromptTemplate.fromTemplate(dedent`          
          You are a grammar and spelling correction assistant. 
          Your task is to fix grammatical errors, spelling mistakes, and improve clarity in text while preserving the original meaning, tone, and intent.
          
          Rules:
          1. Correct all grammar and spelling errors
          2. Preserve the original meaning and factual content exactly
          3. Maintain the author's voice, tone, and perspective
          4. Keep the original language - never translate
          5. Improve sentence structure only when necessary for clarity or semantic improvement
          6. Make direct corrections without explanations, comments, or questions
          7. Focus on making the text more professional and readable while keeping it authentic
          8. RETURN ONLY THE FIXED TEXT
      
          Text to fix: {text}`
      );

      // Get the model based on the provider
      const model = await this.getModel();

      // Create the chain with a string output parser
      const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

      // Invoke the chain
      const processedText = await chain.invoke({
        text: text
      });
      console.log("langchain result ", processedText);
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

      // Load AWS Bedrock credentials from keyring if provider is AWS_BEDROCK
      if (config.provider === LLMProvider.AWS_BEDROCK) {
        // Initialize AWS Bedrock config if not present
        if (!config.providerConfig) {
          config.providerConfig = {};
        }
        if (!config.providerConfig.awsBedrock) {
          config.providerConfig.awsBedrock = {
            aws_access_key_id: '',
            aws_secret_access_key: '',
            aws_session_token: '',
            region: '',
            cache: false
          };
        }

        try {
          // Load AWS access key ID
          const accessKeyId = await invoke<string>('get_api_key', { 
            provider: `${config.provider}_access_key_id` 
          });
          if (accessKeyId) {
            config.providerConfig.awsBedrock.aws_access_key_id = accessKeyId;
          }

          // Load AWS secret access key
          const secretAccessKey = await invoke<string>('get_api_key', { 
            provider: `${config.provider}_secret_access_key` 
          });
          if (secretAccessKey) {
            config.providerConfig.awsBedrock.aws_secret_access_key = secretAccessKey;
          }

          // Load AWS session token
          const sessionToken = await invoke<string>('get_api_key', { 
            provider: `${config.provider}_session_token` 
          });
          if (sessionToken) {
            config.providerConfig.awsBedrock.aws_session_token = sessionToken;
          }

          // Load AWS region
          const region = await invoke<string>('get_api_key', { 
            provider: `${config.provider}_region` 
          });
          if (region) {
            config.providerConfig.awsBedrock.region = region;
          }
        } catch (keyringError) {
          console.warn('Could not load AWS Bedrock credentials from keyring:', keyringError);
          // Continue without AWS credentials
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

      // Store AWS Bedrock credentials in keyring if provider is AWS_BEDROCK
      if (config.provider === LLMProvider.AWS_BEDROCK && config.providerConfig?.awsBedrock) {
        const awsConfig = config.providerConfig.awsBedrock;

        try {
          // Store AWS access key ID
          if (awsConfig.aws_access_key_id) {
            await invoke('store_api_key', {
              provider: `${config.provider}_access_key_id`,
              apiKey: awsConfig.aws_access_key_id
            });
          }

          // Store AWS secret access key
          if (awsConfig.aws_secret_access_key) {
            await invoke('store_api_key', {
              provider: `${config.provider}_secret_access_key`,
              apiKey: awsConfig.aws_secret_access_key
            });
          }

          // Store AWS session token if provided
          if (awsConfig.aws_session_token) {
            await invoke('store_api_key', {
              provider: `${config.provider}_session_token`,
              apiKey: awsConfig.aws_session_token
            });
          }

        } catch (keyringError) {
          console.error('Failed to store AWS Bedrock credentials in keyring:', keyringError);
        }
      }

      // Store non-sensitive config in localStorage (without sensitive data)
      const nonsensitiveConfig = { ...config };
      // Use type assertion to allow deleting sensitive properties
      const partialConfig = nonsensitiveConfig as Partial<LangChainConfig>;
      partialConfig.apiKey = undefined;

      // Remove sensitive AWS Bedrock credentials from localStorage
      if (partialConfig.providerConfig?.awsBedrock) {
        partialConfig.providerConfig = {
          ...partialConfig.providerConfig,
          awsBedrock: {
            ...partialConfig.providerConfig.awsBedrock,
            aws_access_key_id: '',
            aws_secret_access_key: '',
            aws_session_token: undefined,
            // Keep non-sensitive data
            region: partialConfig.providerConfig.awsBedrock.region,
            cache: partialConfig.providerConfig.awsBedrock.cache
          }
        };
      }

      localStorage.setItem('langchain_config_nonsensitive', JSON.stringify(nonsensitiveConfig));
    } catch (error) {
      console.error('Error saving LangChain configuration', error);
    }
  }
}
