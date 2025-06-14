import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Provider {
  id: string;
  name: string;
  models: Model[];
}

interface Model {
  id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-api-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './api-config.component.html',
  styleUrls: ['./api-config.component.scss']
})
export class ApiConfigComponent {
  // Available providers and models
  providers: Provider[] = [
    {
      id: 'openai',
      name: 'OpenAI',
      models: [
        { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model for complex tasks' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for most tasks' }
      ]
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      models: [
        { id: 'claude-2', name: 'Claude 2', description: 'Advanced reasoning and conversation' },
        { id: 'claude-instant', name: 'Claude Instant', description: 'Faster, more economical option' }
      ]
    }
  ];

  // Selected values
  selectedProvider = 'openai';
  selectedModel = 'gpt-4';
  apiKey = '';

  // Get available models for the selected provider
  get availableModels(): Model[] {
    const provider = this.providers.find(p => p.id === this.selectedProvider);
    return provider ? provider.models : [];
  }

  // Methods to handle settings changes
  onProviderChange(): void {
    // When provider changes, select the first model from that provider
    if (this.availableModels.length > 0) {
      this.selectedModel = this.availableModels[0].id;
    }
    console.log('Provider changed to:', this.selectedProvider);
    // In a real implementation, this would call a service to save the setting
  }

  onModelChange(): void {
    console.log('Model changed to:', this.selectedModel);
    // In a real implementation, this would call a service to save the setting
  }

  onApiKeyChange(): void {
    console.log('API key changed');
    // In a real implementation, this would securely store the API key
  }

  getModelDescription(): string {
    const model = this.availableModels.find(m => m.id === this.selectedModel);
    return model ? model.description : '';
  }
}
