import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    <div class="enhance-page">
      <div class="enhance-textareas">
        <textarea data-testid="input-textarea" pTextarea [(ngModel)]="inputText" rows="10" placeholder="Paste or type text to enhance…" class="enhance-textarea"></textarea>
        <textarea data-testid="output-textarea" pTextarea [(ngModel)]="outputText" rows="10" placeholder="Enhanced text will appear here…" readonly class="enhance-textarea"></textarea>
      </div>

      <div class="enhance-actions">
        <p-button data-testid="enhance-btn" label="Enhance" icon="pi pi-sparkles" (onClick)="enhance()" [loading]="loading" />
        <p-button label="Copy Result" icon="pi pi-copy" severity="secondary" (onClick)="copyResult()" [disabled]="!outputText" />
        <p-button label="Write to Clipboard" icon="pi pi-send" severity="secondary" (onClick)="writeToClipboard()" [disabled]="!outputText" />
      </div>

      @if (error) {
        <p-message data-testid="error-message" severity="error" [text]="error" />
      }
    </div>
  `,
  styles: [`
    .enhance-page { display: flex; flex-direction: column; gap: 1rem; padding: 2.75rem; height: 100%; box-sizing: border-box; }
    .hint-text { margin: 0; font-size: 0.875rem; color: var(--p-text-muted-color); }
    .enhance-textareas { display: flex; gap: 2.75rem; flex: 1; }
    .enhance-textarea { flex: 1; resize: none; min-height: 200px; }
    .enhance-actions { display: flex; gap: 0.5rem; }
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
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Listen for shortcut events from backend — auto-populate from clipboard.
    this.sub = this.wails.shortcutTriggered$.subscribe(async () => {
      this.inputText = await this.wails.readClipboard();
      this.cdr.detectChanges();
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
      this.cdr.detectChanges();
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
