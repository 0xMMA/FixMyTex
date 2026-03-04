import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { WailsService, Settings as AppSettings } from '../../core/wails.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule,
    Tabs, TabList, Tab, TabPanels, TabPanel, MessageModule,
  ],
  template: `
    <div class="settings-container">
      <h2>Settings</h2>

      @if (settings) {
        <p-tabs>
          <p-tablist>
            <p-tab value="general">General</p-tab>
            <p-tab value="providers">AI Providers</p-tab>
            <p-tab value="about">About</p-tab>
          </p-tablist>

          <p-tabpanels>
            <p-tabpanel value="general">
              <div class="form-group">
                <label>Active Provider</label>
                <p-select
                  [(ngModel)]="settings.active_provider"
                  [options]="providers"
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
              <div class="form-group">
                <label>Shortcut Key</label>
                <input pInputText [(ngModel)]="settings.shortcut_key" placeholder="ctrl+g" />
              </div>
              <div class="form-group inline">
                <label>Start on Boot</label>
                <p-toggle-switch [(ngModel)]="settings.start_on_boot" />
              </div>
              <div class="form-group">
                <label>Theme</label>
                <p-select
                  [(ngModel)]="settings.theme_preference"
                  [options]="themes"
                  optionLabel="label"
                  optionValue="value"
                />
              </div>
            </p-tabpanel>

            <p-tabpanel value="providers">
              <div class="form-group">
                <label>OpenAI API Key</label>
                <input pInputText [(ngModel)]="settings.providers.openai_key" type="password" placeholder="sk-…" />
              </div>
              <div class="form-group">
                <label>Claude API Key</label>
                <input pInputText [(ngModel)]="settings.providers.claude_key" type="password" placeholder="sk-ant-…" />
              </div>
              <div class="form-group">
                <label>Ollama URL</label>
                <input pInputText [(ngModel)]="settings.providers.ollama_url" placeholder="http://localhost:11434" />
              </div>
              <div class="form-group">
                <label>AWS Region</label>
                <input pInputText [(ngModel)]="settings.providers.aws_region" placeholder="us-east-1" />
              </div>
            </p-tabpanel>

            <p-tabpanel value="about">
              <p>FixMyTex v2 — Wails v3 + Angular v21</p>
              <p>Built with Go, Angular, and PrimeNG.</p>
            </p-tabpanel>
          </p-tabpanels>
        </p-tabs>

        @if (saved) {
          <p-message severity="success" text="Settings saved!" />
        }

        <div class="actions">
          <p-button label="Save" icon="pi pi-check" (onClick)="save()" />
        </div>
      }
    </div>
  `,
  styles: [`
    .settings-container {
      padding: 2rem;
      color: var(--p-surface-100, #f4f4f5);
      max-width: 700px;
    }
    h2 { margin: 0 0 1.5rem; color: var(--p-primary-color, #f97316); }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.25rem;
    }
    .form-group.inline {
      flex-direction: row;
      align-items: center;
      gap: 1rem;
    }
    label { font-size: 0.875rem; color: var(--p-surface-300, #d4d4d8); }
    input { width: 100%; }
    .actions { margin-top: 1.5rem; }
  `],
})
export class SettingsComponent implements OnInit {
  settings: AppSettings | null = null;
  saved = false;

  readonly providers = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic Claude', value: 'claude' },
    { label: 'Ollama (local)', value: 'ollama' },
    { label: 'AWS Bedrock', value: 'bedrock' },
  ];

  readonly themes = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  constructor(private readonly wails: WailsService) {}

  async ngOnInit(): Promise<void> {
    this.settings = await this.wails.loadSettings();
  }

  async save(): Promise<void> {
    if (!this.settings) return;
    await this.wails.saveSettings(this.settings);
    this.saved = true;
    setTimeout(() => (this.saved = false), 3000);
  }
}
