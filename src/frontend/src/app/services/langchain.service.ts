import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { LangChainConfig, DEFAULT_CONFIG, ProviderConfig, DEFAULT_PROVIDERS, LLMProvider } from '../models/langchain-config';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

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
    this.loadConfig();
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
  public updateConfig(config: Partial<LangChainConfig>): void {
    const currentConfig = this.configSubject.getValue();
    const newConfig = { ...currentConfig, ...config };
    this.configSubject.next(newConfig);
    this.saveConfig(newConfig);
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
  private loadConfig(): void {
    try {
      const savedConfig = localStorage.getItem('langchain_config');
      if (savedConfig) {
        const config = JSON.parse(savedConfig);
        this.configSubject.next(config);
      }
    } catch (error) {
      console.error('Error loading LangChain configuration', error);
    }
  }

  /**
   * Save the LangChain configuration to storage
   * @param config The configuration to save
   */
  private saveConfig(config: LangChainConfig): void {
    try {
      localStorage.setItem('langchain_config', JSON.stringify(config));
    } catch (error) {
      console.error('Error saving LangChain configuration', error);
    }
  }
}
