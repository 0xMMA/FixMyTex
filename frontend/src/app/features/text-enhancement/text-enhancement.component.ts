import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { WailsService } from '../../core/wails.service';
import { TextEnhancementService } from './text-enhancement.service';

@Component({
  selector: 'app-text-enhancement',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TextareaModule, ProgressSpinnerModule, MessageModule],
  template: `
    <div class="enhance-container">
      <h2>Text Enhancement</h2>

      <div class="panels">
        <div class="panel">
          <label>Input</label>
          <textarea pTextarea [(ngModel)]="inputText" rows="12" placeholder="Paste or type text to enhance…"></textarea>
        </div>
        <div class="panel">
          <label>Output</label>
          <textarea pTextarea [(ngModel)]="outputText" rows="12" placeholder="Enhanced text will appear here…" readonly></textarea>
        </div>
      </div>

      @if (error) {
        <p-message severity="error" [text]="error" />
      }

      <div class="actions">
        <p-button label="Enhance" icon="pi pi-sparkles" (onClick)="enhance()" [loading]="loading" />
        <p-button label="Copy Result" icon="pi pi-copy" severity="secondary" (onClick)="copyResult()" [disabled]="!outputText" />
        <p-button label="Write to Clipboard" icon="pi pi-send" severity="secondary" (onClick)="writeToClipboard()" [disabled]="!outputText" />
      </div>
    </div>
  `,
  styles: [`
    .enhance-container {
      padding: 2rem;
      color: var(--p-surface-100, #f4f4f5);
    }
    h2 { margin: 0 0 1.5rem; color: var(--p-primary-color, #f97316); }
    .panels {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .panel { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.875rem; color: var(--p-surface-300, #d4d4d8); }
    textarea { width: 100%; resize: vertical; }
    .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.5rem; }
  `],
})
export class TextEnhancementComponent implements OnInit, OnDestroy {
  inputText = '';
  outputText = '';
  loading = false;
  error = '';

  private sub?: Subscription;

  constructor(
    private readonly wails: WailsService,
    private readonly svc: TextEnhancementService,
  ) {}

  ngOnInit(): void {
    // Listen for shortcut events from backend — auto-populate from clipboard.
    this.sub = this.wails.shortcutTriggered$.subscribe(async () => {
      this.inputText = await this.wails.readClipboard();
      await this.enhance();
    });
  }

  async enhance(): Promise<void> {
    if (!this.inputText.trim()) return;
    this.loading = true;
    this.error = '';
    try {
      this.outputText = await this.svc.enhance(this.inputText);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }

  async copyResult(): Promise<void> {
    await navigator.clipboard.writeText(this.outputText);
  }

  async writeToClipboard(): Promise<void> {
    await this.wails.writeClipboard(this.outputText);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
