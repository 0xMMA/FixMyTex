import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { Stepper, StepItem, Step, StepPanel } from 'primeng/stepper';
import { WailsService, Settings as AppSettings } from '../../core/wails.service';

@Component({
  selector: 'app-welcome-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, InputTextModule, SelectModule, Stepper, StepItem, Step, StepPanel],
  template: `
    <div class="wizard-wrapper">
      <div class="wizard-card">
        <h1>Welcome to <span class="brand">FixMyTex</span></h1>
        <p class="subtitle">Let's get you set up in a few quick steps.</p>

        <p-stepper [(value)]="step" [linear]="true">
          <!-- Step 1: Welcome -->
          <p-step-item [value]="1">
            <p-step>Welcome</p-step>
            <p-step-panel>
              <p>FixMyTex uses AI to fix grammar, spelling, and improve your writing — triggered by a global keyboard shortcut.</p>
              <div class="step-footer">
                <p-button label="Get Started" icon="pi pi-arrow-right" iconPos="right" (onClick)="step = 2" />
              </div>
            </p-step-panel>
          </p-step-item>

          <!-- Step 2: Choose provider -->
          <p-step-item [value]="2">
            <p-step>AI Provider</p-step>
            <p-step-panel>
              <p>Choose which AI provider to use for text enhancement:</p>
              <p-select
                [(ngModel)]="selectedProvider"
                [options]="providers"
                optionLabel="label"
                optionValue="value"
                placeholder="Select a provider"
              />
              <div class="step-footer">
                <p-button label="Back" severity="secondary" (onClick)="step = 1" />
                <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="step = 3" [disabled]="!selectedProvider" />
              </div>
            </p-step-panel>
          </p-step-item>

          <!-- Step 3: API Key -->
          <p-step-item [value]="3">
            <p-step>API Key</p-step>
            <p-step-panel>
              <p>Enter your API key for <strong>{{ providerLabel }}</strong>:</p>
              <input pInputText [(ngModel)]="apiKey" type="password" [placeholder]="apiKeyPlaceholder" style="width: 100%" />
              <div class="step-footer">
                <p-button label="Back" severity="secondary" (onClick)="step = 2" />
                <p-button label="Next" icon="pi pi-arrow-right" iconPos="right" (onClick)="step = 4" [disabled]="!apiKey && selectedProvider !== 'ollama'" />
              </div>
            </p-step-panel>
          </p-step-item>

          <!-- Step 4: Done -->
          <p-step-item [value]="4">
            <p-step>Done</p-step>
            <p-step-panel>
              <p>You're all set! Press <kbd>Ctrl+G</kbd> anywhere to enhance selected text.</p>
              <div class="step-footer">
                <p-button label="Start Using FixMyTex" icon="pi pi-check" (onClick)="finish()" [loading]="finishing" />
              </div>
            </p-step-panel>
          </p-step-item>
        </p-stepper>
      </div>
    </div>
  `,
  styles: [`
    .wizard-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--p-surface-950, #09090b);
    }
    .wizard-card {
      background: var(--p-surface-900, #18181b);
      border: 1px solid var(--p-surface-700, #3f3f46);
      border-radius: 12px;
      padding: 2.5rem;
      width: 520px;
      color: var(--p-surface-100, #f4f4f5);
    }
    h1 { margin: 0 0 0.5rem; }
    .brand { color: var(--p-primary-color, #f97316); }
    .subtitle { color: var(--p-surface-400, #a1a1aa); margin-bottom: 2rem; }
    .step-footer {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      justify-content: flex-end;
    }
    kbd {
      background: var(--p-surface-800, #27272a);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: monospace;
    }
  `],
})
export class WelcomeWizardComponent implements OnInit {
  step = 1;
  selectedProvider = 'openai';
  apiKey = '';
  finishing = false;

  readonly providers = [
    { label: 'OpenAI (GPT)', value: 'openai' },
    { label: 'Anthropic Claude', value: 'claude' },
    { label: 'Ollama (local, free)', value: 'ollama' },
  ];

  constructor(private readonly wails: WailsService, private readonly router: Router) {}

  async ngOnInit(): Promise<void> {
    const isFirst = await this.wails.isFirstRun();
    if (!isFirst) {
      await this.router.navigate(['/']);
    }
  }

  get providerLabel(): string {
    return this.providers.find(p => p.value === this.selectedProvider)?.label ?? '';
  }

  get apiKeyPlaceholder(): string {
    switch (this.selectedProvider) {
      case 'openai': return 'sk-…';
      case 'claude': return 'sk-ant-…';
      default: return 'No key required for Ollama';
    }
  }

  async finish(): Promise<void> {
    this.finishing = true;
    try {
      const settings = (await this.wails.loadSettings()) as AppSettings ?? {
        active_provider: this.selectedProvider,
        providers: { openai_key: '', claude_key: '', ollama_url: '', aws_region: '', aws_key_id: '', aws_secret: '' },
        shortcut_key: 'ctrl+g',
        start_on_boot: false,
        theme_preference: 'system',
        completed_setup: false,
      };
      settings.active_provider = this.selectedProvider;
      if (this.selectedProvider === 'openai') settings.providers.openai_key = this.apiKey;
      if (this.selectedProvider === 'claude') settings.providers.claude_key = this.apiKey;
      await this.wails.saveSettings(settings);
      await this.wails.completeSetup();
      await this.router.navigate(['/']);
    } finally {
      this.finishing = false;
    }
  }
}
