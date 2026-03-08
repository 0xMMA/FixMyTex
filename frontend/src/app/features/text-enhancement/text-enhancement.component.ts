import { Component, OnInit, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TextareaModule } from 'primeng/textarea';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { MessageModule } from 'primeng/message';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from 'primeng/tabs';
import { TooltipModule } from 'primeng/tooltip';
import { WailsService } from '../../core/wails.service';
import { TextEnhancementService } from './text-enhancement.service';
import { MarkdownPipe } from './markdown.pipe';

// ── Module-level state (survives navigation; cleared only on full app restart) ──
interface TraceEntry {
  id: string;
  label: string;
  snapshot: string;
  timestamp: Date;
}

let originalText = '';
let pyramidizedText = '';   // snapshot of most recent foundation call
let canvasText = '';         // live working surface
let sourceApp = '';          // captured source app name (from hotkey)
let docType = 'auto';
let commStyle = 'professional';
let relLevel = 'professional';
let traceLog: TraceEntry[] = [];
let activeTab: 'original' | 'canvas' = 'original';
let isPreviewMode = false;
let traceLogOpen = false;
let wasCancelled = false;

let bannerDismissed = false; // session-only

function makeId(): string {
  return Math.random().toString(36).slice(2);
}

function addTrace(label: string, snapshot: string): void {
  traceLog = [
    ...traceLog,
    { id: makeId(), label, snapshot, timestamp: new Date() },
  ];
}

@Component({
  selector: 'app-text-enhancement',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SelectModule,
    ButtonModule,
    TextareaModule,
    ProgressSpinnerModule,
    MessageModule,
    Tabs, TabList, Tab, TabPanels, TabPanel,
    TooltipModule,
    MarkdownPipe,
  ],
  template: `
    <div class="pyramidize-page">

      <!-- ── Left panel ── -->
      <div class="left-panel">

        @if (!bannerDismissedView && !apiKeySet) {
          <div class="api-key-banner" data-testid="api-key-banner">
            <span>⚠ No AI API key configured.</span>
            <p-button
              icon="pi pi-times"
              size="small"
              severity="secondary"
              [text]="true"
              (onClick)="dismissBanner()"
              pTooltip="Dismiss"
            />
          </div>
        }

        <div class="form-group">
          <label>Document Type</label>
          <p-select
            data-testid="doc-type-select"
            [(ngModel)]="docTypeView"
            [options]="docTypeOptions"
            optionLabel="label"
            optionValue="value"
            (onChange)="onDocTypeChange()"
          />
          @if (detectedTypeView) {
            <div class="detection-badge">
              <span class="detection-dot">●</span>
              <span>{{ detectedTypeView }}</span>
            </div>
          }
        </div>

        <div class="form-group">
          <label>Communication Style</label>
          <p-select
            [(ngModel)]="commStyleView"
            [options]="commStyleOptions"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div class="form-group">
          <label>Relationship Level</label>
          <p-select
            [(ngModel)]="relLevelView"
            [options]="relLevelOptions"
            optionLabel="label"
            optionValue="value"
          />
        </div>

        <div class="form-group">
          <label>Custom Instructions</label>
          <textarea
            pTextarea
            [(ngModel)]="customInstructions"
            rows="3"
            placeholder="Optional one-off instruction…"
            class="custom-instructions-textarea"
          ></textarea>
        </div>

        <p-button
          data-testid="pyramidize-btn"
          label="Pyramidize"
          icon="pi pi-sparkles"
          [disabled]="!originalTextView.trim() || isLoading"
          (onClick)="pyramidize()"
          [loading]="isLoading"
          class="pyramidize-btn-full"
        >
          <ng-template #content>
            <span>Pyramidize</span>
            <span class="shortcut-hint">Ctrl+↵</span>
          </ng-template>
        </p-button>

        <div class="provider-badge" (click)="goToSettings()">
          <span class="provider-dot">⚫</span>
          <span class="provider-name">{{ activeProvider }}</span>
        </div>
      </div>

      <!-- ── Canvas area ── -->
      <div class="canvas-area">

        @if (isLoading) {
          <!-- Step indicator during operations -->
          <div class="step-indicator">
            <p-progressSpinner styleClass="step-spinner" />
            <span class="step-label">{{ stepLabel }}</span>
            <p-button
              data-testid="cancel-btn"
              label="Cancel"
              severity="secondary"
              size="small"
              (onClick)="cancelOperation()"
            />
          </div>
        } @else {
          <p-tabs [value]="activeTabView" (valueChange)="onTabChange($event)">
            <p-tablist>
              <p-tab value="original">Original</p-tab>
              <p-tab value="canvas">Canvas</p-tab>
            </p-tablist>
            <p-tabpanels>
              <!-- Original tab -->
              <p-tabpanel value="original">
                <div class="tab-panel-content">
                  @if (!originalTextView) {
                    <div class="empty-original">
                      <p class="hint-text">Paste or type text to pyramidize.</p>
                      <p-button
                        data-testid="paste-from-clipboard-btn"
                        label="Paste from Clipboard"
                        icon="pi pi-clipboard"
                        severity="secondary"
                        (onClick)="pasteFromClipboard()"
                      />
                    </div>
                  }
                  <textarea
                    #originalTextarea
                    data-testid="original-textarea"
                    pTextarea
                    [(ngModel)]="originalTextView"
                    (ngModelChange)="onOriginalChange($event)"
                    rows="20"
                    placeholder="Paste or type text to pyramidize…"
                    class="canvas-textarea"
                    (keydown)="onOriginalKeydown($event)"
                  ></textarea>
                </div>
              </p-tabpanel>

              <!-- Canvas tab -->
              <p-tabpanel value="canvas">
                <div class="tab-panel-content">
                  <div class="canvas-mode-toggle">
                    <p-button
                      label="Edit"
                      size="small"
                      [severity]="!isPreviewModeView ? 'primary' : 'secondary'"
                      (onClick)="setPreviewMode(false)"
                    />
                    <p-button
                      label="Preview"
                      size="small"
                      [severity]="isPreviewModeView ? 'primary' : 'secondary'"
                      (onClick)="setPreviewMode(true)"
                    />
                  </div>

                  @if (isPreviewModeView) {
                    <div
                      class="canvas-preview"
                      [innerHTML]="canvasTextView | markdown"
                    ></div>
                  } @else {
                    <div class="canvas-edit-wrapper" (mouseup)="onCanvasMouseUp($event)">
                      <textarea
                        #canvasTextarea
                        data-testid="canvas-textarea"
                        pTextarea
                        [(ngModel)]="canvasTextView"
                        (ngModelChange)="onCanvasChange($event)"
                        rows="20"
                        placeholder="Canvas will appear here after Pyramidize…"
                        class="canvas-textarea"
                        (keydown)="onCanvasKeydown($event)"
                      ></textarea>
                    </div>
                  }

                  <!-- Selection bubble -->
                  @if (showSelectionBubble && !isPreviewModeView) {
                    <div
                      class="selection-bubble"
                      [style.top.px]="bubbleY"
                      [style.left.px]="bubbleX"
                    >
                      <input
                        pInputText
                        [(ngModel)]="selectionInstruction"
                        placeholder="Ask AI…"
                        class="bubble-input"
                        (keydown.enter)="applySelectionInstruction()"
                      />
                      <p-button
                        icon="pi pi-sparkles"
                        label="Apply"
                        size="small"
                        [disabled]="!selectionInstruction.trim()"
                        (onClick)="applySelectionInstruction()"
                      />
                      <p-button
                        icon="pi pi-times"
                        size="small"
                        severity="secondary"
                        [text]="true"
                        (onClick)="closeSelectionBubble()"
                      />
                    </div>
                  }
                </div>
              </p-tabpanel>
            </p-tabpanels>
          </p-tabs>
        }

        <!-- Error display -->
        @if (errorMessage) {
          <div class="error-row">
            <span>❌ {{ errorMessage }}</span>
            <p-button label="Retry" size="small" severity="secondary" (onClick)="retry()" />
            <p-button label="Change Provider" size="small" severity="secondary" (onClick)="goToSettings()" />
          </div>
        }

        <!-- Refinement warning -->
        @if (refinementWarning) {
          <div class="refinement-warning">
            ⚠ {{ refinementWarning }}
          </div>
        }

        <!-- Instruction bar (fixed at bottom of canvas area) -->
        <div class="instruction-bar">
          <input
            #instructionInput
            pInputText
            data-testid="global-instruction-input"
            [(ngModel)]="globalInstruction"
            placeholder="Global instruction… (e.g. 'make it shorter')"
            class="instruction-input"
            [disabled]="!canvasTextView.trim() || isLoading"
            (keydown.control.enter)="applyGlobalInstruction()"
          />
          <p-button
            data-testid="apply-instruction-btn"
            label="Apply"
            icon="pi pi-play"
            size="small"
            [disabled]="!globalInstruction.trim() || !canvasTextView.trim() || isLoading"
            (onClick)="applyGlobalInstruction()"
          >
            <ng-template #content>
              <span>Apply</span>
              <span class="shortcut-hint">Ctrl+↵</span>
            </ng-template>
          </p-button>
        </div>

        <!-- Action row -->
        <div class="action-row">
          <p-button
            data-testid="copy-markdown-btn"
            label="Copy Markdown"
            icon="pi pi-copy"
            severity="secondary"
            size="small"
            [disabled]="!canvasTextView"
            (onClick)="copyAsMarkdown()"
          />
          <p-button
            data-testid="copy-rich-text-btn"
            label="Copy Rich Text"
            icon="pi pi-file-word"
            severity="secondary"
            size="small"
            [disabled]="!canvasTextView"
            (onClick)="copyAsRichText()"
          />
          @if (sourceAppView) {
            <p-button
              data-testid="send-back-btn"
              [label]="'Send back to ' + sourceAppView"
              icon="pi pi-send"
              severity="secondary"
              size="small"
              [disabled]="!canvasTextView"
              (onClick)="sendBack()"
            />
          }
        </div>
      </div>

      <!-- ── Trace log panel ── -->
      <div
        class="trace-panel"
        [class.collapsed]="!traceLogOpenView"
        data-testid="trace-log-panel"
      >
        @if (traceLogOpenView) {
          <div class="trace-header">
            <span class="trace-title">Trace Log</span>
            <p-button
              data-testid="add-checkpoint-btn"
              icon="pi pi-plus"
              size="small"
              severity="secondary"
              [text]="true"
              pTooltip="Add checkpoint"
              (onClick)="addCheckpoint()"
            />
            <p-button
              icon="pi pi-chevron-right"
              size="small"
              severity="secondary"
              [text]="true"
              pTooltip="Collapse"
              (onClick)="toggleTraceLog()"
            />
          </div>
          <div class="trace-list">
            @for (entry of traceLogView; track entry.id) {
              <div
                class="trace-entry"
                [class.active]="peekEntry?.id === entry.id"
                (click)="peekTrace(entry)"
              >
                <span class="trace-label">{{ entry.label }}</span>
                <span class="trace-time">{{ formatTime(entry.timestamp) }}</span>
              </div>
            }
          </div>

          @if (peekEntry) {
            <div class="trace-peek">
              <div class="trace-peek-header">
                <span>{{ peekEntry.label }}</span>
                <p-button
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  [text]="true"
                  (onClick)="closePeek()"
                />
              </div>
              <pre class="trace-peek-content">{{ peekEntry.snapshot }}</pre>
              <p-button
                label="Revert to here"
                size="small"
                severity="danger"
                (onClick)="revertTo(peekEntry)"
              />
            </div>
          }
        } @else {
          <div class="trace-icon-strip">
            <p-button
              icon="pi pi-history"
              size="small"
              severity="secondary"
              [text]="true"
              pTooltip="Trace log"
              (onClick)="toggleTraceLog()"
            />
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .pyramidize-page {
      display: flex;
      flex-direction: row;
      height: 100%;
      overflow: hidden;
      gap: 0;
    }

    /* ── Left panel ── */
    .left-panel {
      width: 280px;
      min-width: 280px;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 1rem;
      border-right: 1px solid var(--p-content-border-color);
      overflow-y: auto;
    }

    .api-key-banner {
      background: var(--p-amber-100, #fef3c7);
      color: var(--p-amber-900, #78350f);
      border: 1px solid var(--p-amber-300, #fcd34d);
      border-radius: 6px;
      padding: 0.5rem 0.75rem;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .detection-badge {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      font-size: 0.75rem;
      color: var(--p-primary-color);
      font-weight: 600;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }
    .detection-dot { font-size: 0.6rem; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
    }
    label {
      font-size: 0.8rem;
      color: var(--p-text-muted-color);
    }

    .custom-instructions-textarea {
      width: 100%;
      resize: vertical;
      font-size: 0.85rem;
    }

    .pyramidize-btn-full {
      width: 100%;
    }
    .pyramidize-btn-full ::ng-deep button {
      width: 100%;
      justify-content: space-between;
    }

    .shortcut-hint {
      font-size: 0.7rem;
      opacity: 0.6;
      margin-left: 0.5rem;
    }

    .provider-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      cursor: pointer;
      padding: 0.35rem 0.5rem;
      border-radius: 4px;
      font-size: 0.78rem;
      color: var(--p-text-muted-color);
      transition: background 0.15s;
    }
    .provider-badge:hover { background: var(--p-content-hover-background); }
    .provider-dot { font-size: 0.55rem; }
    .provider-name { font-size: 0.78rem; }

    /* ── Canvas area ── */
    .canvas-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      padding: 1rem;
      gap: 0.75rem;
      min-width: 0;
    }

    .step-indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--p-content-hover-background);
      border-radius: 8px;
    }
    .step-spinner { width: 24px; height: 24px; }
    .step-label { flex: 1; font-size: 0.9rem; }

    .tab-panel-content {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .empty-original {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      pointer-events: none;
      z-index: 1;
    }
    .empty-original p-button { pointer-events: all; }
    .hint-text { font-size: 0.85rem; color: var(--p-text-muted-color); margin: 0; }

    .canvas-textarea {
      width: 100%;
      min-height: 320px;
      resize: vertical;
      font-family: var(--p-font-family);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .canvas-mode-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .canvas-preview {
      min-height: 320px;
      padding: 1rem;
      border: 1px solid var(--p-content-border-color);
      border-radius: 6px;
      overflow-y: auto;
      line-height: 1.7;
    }
    .canvas-preview ::ng-deep h1 { font-size: 1.4rem; margin: 0.5rem 0; }
    .canvas-preview ::ng-deep h2 { font-size: 1.2rem; margin: 0.5rem 0; }
    .canvas-preview ::ng-deep h3 { font-size: 1rem; margin: 0.4rem 0; }
    .canvas-preview ::ng-deep p  { margin: 0.4rem 0; }
    .canvas-preview ::ng-deep ul, .canvas-preview ::ng-deep ol { padding-left: 1.5rem; margin: 0.4rem 0; }
    .canvas-preview ::ng-deep code {
      background: var(--p-content-hover-background);
      padding: 1px 4px;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.85em;
    }

    .canvas-edit-wrapper {
      position: relative;
    }

    /* Selection bubble */
    .selection-bubble {
      position: fixed;
      background: var(--p-surface-overlay, var(--p-surface-card));
      border: 1px solid var(--p-content-border-color);
      border-radius: 8px;
      padding: 0.5rem;
      display: flex;
      gap: 0.4rem;
      align-items: center;
      z-index: 1000;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
    }
    .bubble-input { width: 180px; font-size: 0.85rem; }

    /* Error row */
    .error-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: var(--p-red-400, #f87171);
      font-size: 0.85rem;
      padding: 0.5rem;
      background: var(--p-content-hover-background);
      border-radius: 6px;
    }

    .refinement-warning {
      font-size: 0.8rem;
      color: var(--p-amber-400, #fbbf24);
      padding: 0.4rem 0.5rem;
    }

    /* Instruction bar */
    .instruction-bar {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      border-top: 1px solid var(--p-content-border-color);
      padding-top: 0.75rem;
    }
    .instruction-input { flex: 1; }

    /* Action row */
    .action-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    /* ── Trace log panel ── */
    .trace-panel {
      width: 260px;
      min-width: 260px;
      border-left: 1px solid var(--p-content-border-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: width 0.2s ease;
    }
    .trace-panel.collapsed {
      width: 42px;
      min-width: 42px;
    }

    .trace-icon-strip {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0;
    }

    .trace-header {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid var(--p-content-border-color);
    }
    .trace-title { flex: 1; font-size: 0.8rem; font-weight: 600; }

    .trace-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.25rem 0;
    }

    .trace-entry {
      display: flex;
      flex-direction: column;
      padding: 0.4rem 0.75rem;
      cursor: pointer;
      border-bottom: 1px solid var(--p-content-border-color);
      transition: background 0.1s;
    }
    .trace-entry:hover { background: var(--p-content-hover-background); }
    .trace-entry.active { background: var(--p-highlight-background); }
    .trace-label { font-size: 0.8rem; }
    .trace-time { font-size: 0.7rem; color: var(--p-text-muted-color); }

    .trace-peek {
      border-top: 1px solid var(--p-content-border-color);
      padding: 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .trace-peek-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .trace-peek-content {
      font-size: 0.75rem;
      max-height: 120px;
      overflow-y: auto;
      white-space: pre-wrap;
      word-break: break-word;
      background: var(--p-content-hover-background);
      border-radius: 4px;
      padding: 0.4rem;
      margin: 0;
    }
  `],
})
export class TextEnhancementComponent implements OnInit, OnDestroy {
  // ── Component views (mirror module-level state) ──
  get originalTextView(): string { return originalText; }
  set originalTextView(v: string) { originalText = v; }

  get canvasTextView(): string { return canvasText; }
  set canvasTextView(v: string) { canvasText = v; }

  get docTypeView(): string { return docType; }
  set docTypeView(v: string) { docType = v; }

  get commStyleView(): string { return commStyle; }
  set commStyleView(v: string) { commStyle = v; }

  get relLevelView(): string { return relLevel; }
  set relLevelView(v: string) { relLevel = v; }

  get traceLogView(): TraceEntry[] { return traceLog; }

  get activeTabView(): string { return activeTab; }

  get isPreviewModeView(): boolean { return isPreviewMode; }

  get traceLogOpenView(): boolean { return traceLogOpen; }

  get sourceAppView(): string { return sourceApp; }

  get bannerDismissedView(): boolean { return bannerDismissed; }

  // ── Component-local state (does not need to persist across navigation) ──
  isLoading = false;
  stepLabel = '';
  errorMessage = '';
  refinementWarning = '';
  apiKeySet = true;
  activeProvider = '';
  customInstructions = '';
  globalInstruction = '';
  detectedTypeView = '';

  // Selection bubble
  showSelectionBubble = false;
  bubbleX = 0;
  bubbleY = 0;
  selectionInstruction = '';
  private selectionStart = 0;
  private selectionEnd = 0;

  // Trace peek
  peekEntry: TraceEntry | null = null;

  // Retry state
  private lastRequest: (() => Promise<void>) | null = null;

  private sub?: Subscription;

  @ViewChild('canvasTextarea') canvasTextareaRef?: ElementRef<HTMLTextAreaElement>;

  readonly docTypeOptions = [
    { label: 'AUTO (detect)', value: 'auto' },
    { label: 'Email', value: 'email' },
    { label: 'Wiki', value: 'wiki' },
    { label: 'PowerPoint', value: 'powerpoint' },
    { label: 'Memo', value: 'memo' },
  ];

  readonly commStyleOptions = [
    { label: 'Professional', value: 'professional' },
    { label: 'Casual', value: 'casual' },
    { label: 'Concise', value: 'concise' },
    { label: 'Detailed', value: 'detailed' },
    { label: 'Persuasive', value: 'persuasive' },
    { label: 'Neutral', value: 'neutral' },
    { label: 'Diplomatic', value: 'diplomatic' },
    { label: 'Direct', value: 'direct' },
  ];

  readonly relLevelOptions = [
    { label: 'Professional', value: 'professional' },
    { label: 'Close', value: 'close' },
    { label: 'Authority', value: 'authority' },
    { label: 'Public', value: 'public' },
  ];

  constructor(
    private readonly wails: WailsService,
    private readonly svc: TextEnhancementService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    // Load source app name, check API key status
    sourceApp = await this.wails.getSourceApp();
    const settings = await this.wails.loadSettings();
    this.activeProvider = settings.active_provider ?? '';
    const keyStatus = await this.wails.getKeyStatus(settings.active_provider ?? '');
    this.apiKeySet = keyStatus.is_set;
    this.cdr.detectChanges();

    // Subscribe to hotkey shortcut events
    this.sub = this.wails.shortcutTriggered$.subscribe(async () => {
      const clipboardContent = await this.wails.readClipboard();
      sourceApp = await this.wails.getSourceApp();

      if (originalText && !confirm('Replace current session with new clipboard content?')) {
        return;
      }

      wasCancelled = false;
      originalText = clipboardContent;
      pyramidizedText = '';
      canvasText = '';
      traceLog = [];
      this.detectedTypeView = '';
      activeTab = 'original';
      this.errorMessage = '';
      this.refinementWarning = '';

      if (originalText.trim()) {
        addTrace('Original', originalText);
      }
      this.cdr.detectChanges();
    });
  }

  onOriginalChange(value: string): void {
    originalText = value;
  }

  onCanvasChange(value: string): void {
    canvasText = value;
  }

  onDocTypeChange(): void {
    // Clear detection indicator when user manually picks a type
    if (docType !== 'auto') {
      this.detectedTypeView = '';
    }
  }

  onTabChange(value: unknown): void {
    activeTab = value as 'original' | 'canvas';
  }

  setPreviewMode(preview: boolean): void {
    isPreviewMode = preview;
  }

  toggleTraceLog(): void {
    traceLogOpen = !traceLogOpen;
    this.peekEntry = null;
  }

  dismissBanner(): void {
    bannerDismissed = true;
  }

  // ── Original textarea keyboard shortcut ──
  onOriginalKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      void this.pyramidize();
    }
  }

  // ── Canvas textarea keyboard shortcut ──
  onCanvasKeydown(event: KeyboardEvent): void {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      void this.applyGlobalInstruction();
    }
  }

  async pasteFromClipboard(): Promise<void> {
    const text = await this.wails.readClipboard();
    originalText = text;
    if (originalText.trim()) {
      addTrace('Original', originalText);
    }
    this.cdr.detectChanges();
  }

  async pyramidize(): Promise<void> {
    if (!originalText.trim()) return;

    if (canvasText.trim()) {
      if (!confirm('Re-pyramidize? The current canvas will be saved to the trace log.')) {
        return;
      }
      addTrace('Canvas (saved)', canvasText);
    }

    wasCancelled = false;
    this.errorMessage = '';
    this.refinementWarning = '';
    this.isLoading = true;
    this.stepLabel = 'Step 1/2: Detecting…';
    this.cdr.detectChanges();

    const req = {
      text: originalText,
      documentType: docType,
      communicationStyle: commStyle,
      relationshipLevel: relLevel,
      customInstructions: this.customInstructions,
    };

    const doCall = async (): Promise<void> => {
      this.stepLabel = docType === 'auto' ? 'Step 1/2: Detecting…' : 'Step 1/2: Structuring…';
      this.cdr.detectChanges();

      const result = await this.svc.pyramidize(req);

      if (docType === 'auto' && result.detectedType) {
        this.detectedTypeView = result.detectedType.toUpperCase();
        this.stepLabel = 'Step 2/2: Structuring…';
        this.cdr.detectChanges();
      }

      pyramidizedText = result.fullDocument;
      canvasText = result.fullDocument;
      this.refinementWarning = result.refinementWarning ?? '';

      addTrace('Pyramidized', canvasText);
      activeTab = 'canvas';
    };

    this.lastRequest = async () => {
      this.isLoading = true;
      this.errorMessage = '';
      this.stepLabel = 'Step 1/2: Detecting…';
      this.cdr.detectChanges();
      try {
        await doCall();
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    };

    try {
      await doCall();
    } catch (e: unknown) {
      if (!wasCancelled) {
        this.errorMessage = `Pyramidize failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  async cancelOperation(): Promise<void> {
    wasCancelled = true;
    await this.svc.cancelOperation();
    this.isLoading = false;
    this.stepLabel = '';
    this.cdr.detectChanges();
  }

  async applyGlobalInstruction(): Promise<void> {
    if (!this.globalInstruction.trim() || !canvasText.trim()) return;

    const instruction = this.globalInstruction;
    this.isLoading = true;
    this.stepLabel = 'Refining…';
    this.errorMessage = '';
    wasCancelled = false;
    this.cdr.detectChanges();

    try {
      const result = await this.svc.refineGlobal({
        fullCanvas: canvasText,
        originalText,
        instruction,
        documentType: docType,
        communicationStyle: commStyle,
        relationshipLevel: relLevel,
      });
      addTrace(`Refined: "${instruction.slice(0, 30)}"`, canvasText);
      canvasText = result.newCanvas;
      this.globalInstruction = '';
    } catch (e: unknown) {
      if (!wasCancelled) {
        this.errorMessage = `Refine failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  onCanvasMouseUp(event: MouseEvent): void {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      this.showSelectionBubble = false;
      this.cdr.detectChanges();
      return;
    }

    const textarea = this.canvasTextareaRef?.nativeElement;
    if (textarea) {
      this.selectionStart = textarea.selectionStart;
      this.selectionEnd = textarea.selectionEnd;
    }

    this.showSelectionBubble = true;
    this.bubbleX = event.clientX - 100;
    this.bubbleY = event.clientY - 80;
    this.selectionInstruction = '';
    this.cdr.detectChanges();
  }

  closeSelectionBubble(): void {
    this.showSelectionBubble = false;
    this.selectionInstruction = '';
  }

  async applySelectionInstruction(): Promise<void> {
    if (!this.selectionInstruction.trim()) return;

    const textarea = this.canvasTextareaRef?.nativeElement;
    const start = textarea ? textarea.selectionStart : this.selectionStart;
    const end = textarea ? textarea.selectionEnd : this.selectionEnd;
    const selectedText = canvasText.slice(start, end);

    if (!selectedText.trim()) {
      this.closeSelectionBubble();
      return;
    }

    const instruction = this.selectionInstruction;
    this.closeSelectionBubble();
    this.isLoading = true;
    this.stepLabel = 'Splicing…';
    wasCancelled = false;
    this.cdr.detectChanges();

    try {
      const result = await this.svc.splice({
        fullCanvas: canvasText,
        originalText,
        selectedText,
        instruction,
      });
      const before = canvasText.slice(0, start);
      const after = canvasText.slice(end);
      const oldCanvas = canvasText;
      addTrace(`Splice: "${instruction.slice(0, 30)}"`, oldCanvas);
      canvasText = before + result.rewrittenSection + after;
    } catch (e: unknown) {
      if (!wasCancelled) {
        this.errorMessage = `Splice failed: ${e instanceof Error ? e.message : String(e)}`;
      }
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  addCheckpoint(): void {
    if (canvasText) {
      addTrace('Checkpoint', canvasText);
      this.cdr.detectChanges();
    }
  }

  peekTrace(entry: TraceEntry): void {
    this.peekEntry = entry;
    this.cdr.detectChanges();
  }

  closePeek(): void {
    this.peekEntry = null;
  }

  revertTo(entry: TraceEntry): void {
    addTrace(`Reverted to: ${entry.label}`, canvasText);
    canvasText = entry.snapshot;
    this.peekEntry = null;
    activeTab = 'canvas';
    this.cdr.detectChanges();
  }

  async copyAsMarkdown(): Promise<void> {
    await navigator.clipboard.writeText(canvasText);
  }

  async copyAsRichText(): Promise<void> {
    const pipe = new MarkdownPipe();
    const html = pipe.transform(canvasText);
    const plain = canvasText;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      // Fallback: write plain text
      await navigator.clipboard.writeText(plain);
    }
  }

  async sendBack(): Promise<void> {
    await this.svc.sendBack(canvasText);
  }

  goToSettings(): void {
    void this.router.navigate(['/settings']);
  }

  async retry(): Promise<void> {
    if (this.lastRequest) {
      await this.lastRequest();
    }
  }

  formatTime(d: Date): string {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
