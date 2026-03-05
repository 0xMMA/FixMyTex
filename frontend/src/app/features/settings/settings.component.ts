import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { WailsService, Settings as AppSettings, KeyStatus } from '../../core/wails.service';

interface ProviderKey {
  id: string;
  label: string;
  status: KeyStatus | null;
  editing: boolean;
  draftKey: string;
  saving: boolean;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, InputTextModule, SelectModule, ToggleSwitchModule,
    Tabs, TabList, Tab, TabPanels, TabPanel, MessageModule, CardModule, TagModule,
  ],
  template: `
    <div class="settings-page">
      <p-card>
        @if (settings) {
          <p-tabs value="general">
            <p-tablist>
              <p-tab value="general">General</p-tab>
              <p-tab value="providers">AI Providers</p-tab>
              <p-tab value="about">About</p-tab>
            </p-tablist>

            <p-tabpanels>
              <!-- General tab -->
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
                  <input data-testid="shortcut-input" pInputText [(ngModel)]="settings.shortcut_key" placeholder="ctrl+g" />
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

              <!-- AI Providers / Keys tab -->
              <p-tabpanel value="providers">
                <p class="hint-text">
                  Keys are stored in your OS keyring (Windows Credential Manager / libsecret on Linux).
                  Environment variables (<code>OPENAI_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>) take priority and cannot be overridden here.
                </p>

                @for (pk of providerKeys; track pk.id) {
                  <div class="key-row">
                    <div class="key-header">
                      <span class="key-label">{{ pk.label }}</span>
                      @if (pk.status) {
                        @if (pk.status.is_set && pk.status.source === 'env') {
                          <p-tag value="from env var" severity="info" />
                        } @else if (pk.status.is_set) {
                          <p-tag value="● set" severity="success" />
                        } @else {
                          <p-tag value="not set" severity="secondary" />
                        }
                      }
                    </div>

                    @if (pk.editing) {
                      <div class="key-edit">
                        <input pInputText
                          type="password"
                          [(ngModel)]="pk.draftKey"
                          [placeholder]="keyPlaceholder(pk.id)"
                          style="flex:1"
                        />
                        <p-button
                          label="Save"
                          icon="pi pi-check"
                          size="small"
                          (onClick)="saveKey(pk)"
                          [loading]="pk.saving"
                          [disabled]="!pk.draftKey"
                        />
                        <p-button
                          label="Cancel"
                          icon="pi pi-times"
                          severity="secondary"
                          size="small"
                          (onClick)="cancelEdit(pk)"
                        />
                      </div>
                    } @else {
                      <div class="key-actions">
                        @if (pk.status?.source !== 'env') {
                          <p-button
                            [label]="pk.status?.is_set ? 'Update' : 'Set Key'"
                            icon="pi pi-key"
                            severity="secondary"
                            size="small"
                            (onClick)="startEdit(pk)"
                          />
                          @if (pk.status?.is_set) {
                            <p-button
                              label="Clear"
                              icon="pi pi-trash"
                              severity="danger"
                              size="small"
                              (onClick)="clearKey(pk)"
                              [loading]="pk.saving"
                            />
                          }
                        }
                      </div>
                    }
                  </div>
                }

                <!-- Ollama URL (not a secret) -->
                <div class="form-group mt-4">
                  <label>Ollama Server URL</label>
                  <input pInputText [(ngModel)]="settings.providers.ollama_url" placeholder="http://localhost:11434" />
                  <small class="hint-text">Only needed when using Ollama as the provider.</small>
                </div>
              </p-tabpanel>

              <!-- About tab -->
              <p-tabpanel value="about">
                <p>FixMyTex v2 — Wails v3 + Angular v21</p>
                <p>Built with Go, Angular, and PrimeNG.</p>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>

          @if (saved) {
            <p-message data-testid="saved-banner" severity="success" text="Settings saved!" styleClass="mt-3" />
          }
          @if (keyError) {
            <p-message severity="error" [text]="keyError" styleClass="mt-3" />
          }

          <div class="mt-4 flex gap-3">
            <p-button data-testid="save-btn" label="Save" icon="pi pi-check" (onClick)="save()" />
            <p-button data-testid="reset-btn" label="Reset to Defaults" icon="pi pi-refresh" severity="danger" outlined (onClick)="resetToDefaults()" />
          </div>
        }
      </p-card>
    </div>
  `,
  styles: [`
    .settings-page { padding: 1.5rem; max-width: 700px; }
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
    label { font-size: 0.875rem; color: var(--p-text-muted-color); }
    input { width: 100%; }

    .key-row {
      border: 1px solid var(--p-content-border-color);
      border-radius: var(--p-border-radius-md, 6px);
      padding: 0.75rem 1rem;
      margin-bottom: 0.75rem;
    }
    .key-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .key-label {
      font-weight: 600;
      font-size: 0.9rem;
    }
    .key-edit {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-top: 0.5rem;
    }
    .key-actions {
      display: flex;
      gap: 0.5rem;
    }
    .hint-text {
      font-size: 0.8rem;
      color: var(--p-text-muted-color);
      margin-bottom: 1rem;
    }
    code {
      background: var(--p-content-hover-background);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.85em;
    }
  `],
})
export class SettingsComponent implements OnInit {
  settings: AppSettings | null = null;
  saved = false;
  keyError = '';

  readonly providers = [
    { label: 'OpenAI', value: 'openai' },
    { label: 'Anthropic Claude', value: 'claude' },
    { label: 'Ollama (local)', value: 'ollama' },
    { label: 'AWS Bedrock', value: 'bedrock' },
  ];

  readonly themes = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
    { label: 'System', value: 'system' },
  ];

  providerKeys: ProviderKey[] = [
    { id: 'openai',  label: 'OpenAI API Key',      status: null, editing: false, draftKey: '', saving: false },
    { id: 'claude',  label: 'Anthropic API Key',    status: null, editing: false, draftKey: '', saving: false },
    { id: 'bedrock', label: 'AWS Secret Access Key', status: null, editing: false, draftKey: '', saving: false },
  ];

  constructor(private readonly wails: WailsService, private readonly cdr: ChangeDetectorRef) {}

  async ngOnInit(): Promise<void> {
    this.settings = await this.wails.loadSettings();
    await this.refreshKeyStatuses();
    this.cdr.detectChanges();
  }

  private async refreshKeyStatuses(): Promise<void> {
    await Promise.all(
      this.providerKeys.map(async pk => {
        pk.status = await this.wails.getKeyStatus(pk.id);
      }),
    );
  }

  keyPlaceholder(provider: string): string {
    switch (provider) {
      case 'openai':  return 'sk-…';
      case 'claude':  return 'sk-ant-…';
      case 'bedrock': return 'AWS secret access key';
      default:        return 'API key';
    }
  }

  startEdit(pk: ProviderKey): void {
    pk.editing = true;
    pk.draftKey = '';
  }

  cancelEdit(pk: ProviderKey): void {
    pk.editing = false;
    pk.draftKey = '';
  }

  async saveKey(pk: ProviderKey): Promise<void> {
    if (!pk.draftKey) return;
    pk.saving = true;
    this.keyError = '';
    try {
      await this.wails.setKey(pk.id, pk.draftKey);
      pk.editing = false;
      pk.draftKey = '';
      pk.status = await this.wails.getKeyStatus(pk.id);
    } catch (e) {
      this.keyError = `Failed to save key: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      pk.saving = false;
    }
  }

  async clearKey(pk: ProviderKey): Promise<void> {
    pk.saving = true;
    this.keyError = '';
    try {
      await this.wails.deleteKey(pk.id);
      pk.status = await this.wails.getKeyStatus(pk.id);
    } catch (e) {
      this.keyError = `Failed to clear key: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      pk.saving = false;
    }
  }

  async save(): Promise<void> {
    if (!this.settings) return;
    await this.wails.saveSettings(this.settings);
    this.saved = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.saved = false; this.cdr.detectChanges(); }, 3000);
  }

  async resetToDefaults(): Promise<void> {
    await this.wails.resetSettings();
    this.settings = await this.wails.loadSettings();
    this.saved = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.saved = false; this.cdr.detectChanges(); }, 3000);
  }
}
