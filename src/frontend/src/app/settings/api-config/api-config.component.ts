import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LangChainService } from '../../services/langchain.service';
import { 
  ProviderConfig, 
  ModelConfig, 
  LLMProvider, 
  AwsBedrockConfig 
} from '../../models/langchain-config';

@Component({
  selector: 'app-api-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-config.component.html',
  styleUrls: ['./api-config.component.scss']
})
export class ApiConfigComponent implements OnInit, OnDestroy {
  // Available providers and models
  providers: ProviderConfig[] = [];

  // Selected values
  selectedProvider: LLMProvider = LLMProvider.OPENAI;
  selectedModel: string = '';
  apiKey: string = '';
  baseUrl: string = 'http://localhost:11434';
  customModel: string = '';

  // AWS Bedrock configuration
  awsBedrockConfig: AwsBedrockConfig = {
    aws_access_key_id: '',
    aws_secret_access_key: '',
    aws_session_token: '',
    region: '',
    cache: false,
    inferenceProfile: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(private langChainService: LangChainService) {}

  ngOnInit(): void {
    // Subscribe to providers
    this.subscriptions.push(
      this.langChainService.providers$.subscribe(providers => {
        this.providers = providers;
      })
    );

    // Subscribe to config
    this.subscriptions.push(
      this.langChainService.config$.subscribe(config => {
        this.selectedProvider = config.provider;
        this.selectedModel = config.model;
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'http://localhost:11434';

        // Load AWS Bedrock configuration if available
        if (config.provider === LLMProvider.AWS_BEDROCK && config.providerConfig?.awsBedrock) {
          this.awsBedrockConfig = {
            ...this.awsBedrockConfig,
            ...config.providerConfig.awsBedrock
          };
        }

        // Handle custom model for Ollama
        if (config.provider === LLMProvider.OLLAMA && config.model === 'custom') {
          this.customModel = config.customModelName || '';
        }
      })
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Get available models for the selected provider
  get availableModels(): ModelConfig[] {
    return this.langChainService.getModelsForProvider(this.selectedProvider);
  }

  // Methods to handle settings changes
  onProviderChange(): void {
    // When provider changes, select the first model from that provider
    if (this.availableModels.length > 0) {
      this.selectedModel = this.availableModels[0].id;
    }

    // Prepare the configuration update
    const configUpdate: any = {
      provider: this.selectedProvider,
      model: this.selectedModel
    };

    // If switching to AWS Bedrock, include the AWS Bedrock configuration
    if (this.selectedProvider === LLMProvider.AWS_BEDROCK) {
      configUpdate.providerConfig = {
        awsBedrock: this.awsBedrockConfig
      };
    }

    // If switching to Ollama, include the baseUrl
    if (this.selectedProvider === LLMProvider.OLLAMA) {
      configUpdate.baseUrl = this.baseUrl;

      // Handle custom model
      if (this.selectedModel === 'custom') {
        // Initialize customModel if empty
        if (!this.customModel) {
          this.customModel = '';
        }
        // Include customModelName in the update
        configUpdate.customModelName = this.customModel;
      } else {
        // Reset customModel if not using custom model
        this.customModel = '';
      }
    }

    // Update the configuration
    this.langChainService.updateConfig(configUpdate);

    console.log('Provider changed to:', this.selectedProvider);
  }

  onModelChange(): void {
    // Update the configuration
    const configUpdate: any = {
      model: this.selectedModel
    };

    // If selecting custom model, ensure customModelName is preserved
    if (this.selectedProvider === LLMProvider.OLLAMA && this.selectedModel === 'custom') {
      // If customModel is empty, initialize it with a default value or keep it empty
      if (!this.customModel) {
        this.customModel = '';
      }
      // Include customModelName in the update
      configUpdate.customModelName = this.customModel;
    }

    this.langChainService.updateConfig(configUpdate);

    console.log('Model changed to:', this.selectedModel);
  }

  onApiKeyChange(): void {
    // Update the configuration
    this.langChainService.updateConfig({
      apiKey: this.apiKey
    });

    console.log('API key changed');
  }

  onBaseUrlChange(): void {
    // Update the configuration
    this.langChainService.updateConfig({
      baseUrl: this.baseUrl
    });

    console.log('Base URL changed to:', this.baseUrl);
  }

  onCustomModelChange(): void {
    if (this.selectedProvider === LLMProvider.OLLAMA && this.selectedModel === 'custom') {
      // Update the configuration with the custom model name
      this.langChainService.updateConfig({
        customModelName: this.customModel
      });

      console.log('Custom model changed to:', this.customModel);
    }
  }

  getModelDescription(): string {
    const model = this.availableModels.find(m => m.id === this.selectedModel);
    return model ? model.description : '';
  }

  // Methods to handle AWS Bedrock configuration changes
  onAwsAccessKeyIdChange(): void {
    this.updateAwsBedrockConfig();
  }

  onAwsSecretAccessKeyChange(): void {
    this.updateAwsBedrockConfig();
  }

  onAwsSessionTokenChange(): void {
    this.updateAwsBedrockConfig();
  }

  onAwsRegionChange(): void {
    this.updateAwsBedrockConfig();
  }

  onAwsCacheChange(): void {
    this.updateAwsBedrockConfig();
  }

  onAwsInferenceProfileChange(): void {
    this.updateAwsBedrockConfig();
  }

  private updateAwsBedrockConfig(): void {
    if (this.selectedProvider === LLMProvider.AWS_BEDROCK) {
      this.langChainService.updateConfig({
        providerConfig: {
          awsBedrock: this.awsBedrockConfig
        }
      });
    }
  }

  // Check if the current provider is AWS Bedrock
  get isAwsBedrock(): boolean {
    return this.selectedProvider === LLMProvider.AWS_BEDROCK;
  }

  // Check if the current provider is Ollama
  get isOllama(): boolean {
    return this.selectedProvider === LLMProvider.OLLAMA;
  }

  // Check if the current model is a custom Ollama model
  get isCustomOllamaModel(): boolean {
    return this.isOllama && this.selectedModel === 'custom';
  }
}
