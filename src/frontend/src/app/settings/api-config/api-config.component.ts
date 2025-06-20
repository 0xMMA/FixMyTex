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

        // Load AWS Bedrock configuration if available
        if (config.provider === LLMProvider.AWS_BEDROCK && config.providerConfig?.awsBedrock) {
          this.awsBedrockConfig = {
            ...this.awsBedrockConfig,
            ...config.providerConfig.awsBedrock
          };
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

    // Update the configuration
    this.langChainService.updateConfig(configUpdate);

    console.log('Provider changed to:', this.selectedProvider);
  }

  onModelChange(): void {
    // Update the configuration
    this.langChainService.updateConfig({
      model: this.selectedModel
    });

    console.log('Model changed to:', this.selectedModel);
  }

  onApiKeyChange(): void {
    // Update the configuration
    this.langChainService.updateConfig({
      apiKey: this.apiKey
    });

    console.log('API key changed');
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
}
