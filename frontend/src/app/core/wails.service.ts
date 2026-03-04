import { Injectable, OnDestroy, isDevMode } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { Events } from '@wailsio/runtime';

// Generated bindings — auto-updated by `wails3 generate bindings`
import * as SettingsService from '../../../bindings/fixmytex/internal/features/settings/service.js';
import * as WelcomeService from '../../../bindings/fixmytex/internal/features/welcome/service.js';
import * as ClipboardService from '../../../bindings/fixmytex/internal/features/clipboard/service.js';
import * as SimulateService from '../../../bindings/fixmytex/simulateservice.js';
import { Settings } from '../../../bindings/fixmytex/internal/features/settings/models.js';

export type { Settings };

@Injectable({ providedIn: 'root' })
export class WailsService implements OnDestroy {
  private readonly shortcutTriggered = new Subject<string>();
  private readonly settingsChanged = new Subject<void>();
  private readonly unsubscribers: Array<() => void> = [];

  /** Emits whenever the global shortcut fires (real hotkey or simulated). */
  readonly shortcutTriggered$: Observable<string> = this.shortcutTriggered.asObservable();
  /** Emits whenever settings are saved from the backend. */
  readonly settingsChanged$: Observable<void> = this.settingsChanged.asObservable();

  constructor() {
    this.listenToEvents();
  }

  private listenToEvents(): void {
    this.unsubscribers.push(
      Events.On('shortcut:triggered', (ev) => {
        this.shortcutTriggered.next(ev.data as string);
      }),
      Events.On('settings:changed', () => {
        this.settingsChanged.next();
      }),
    );
  }

  loadSettings(): Promise<Settings> {
    return SettingsService.Get();
  }

  saveSettings(s: Settings): Promise<void> {
    return SettingsService.Save(s);
  }

  isFirstRun(): Promise<boolean> {
    return WelcomeService.IsFirstRun();
  }

  completeSetup(): Promise<void> {
    return WelcomeService.CompleteSetup();
  }

  readClipboard(): Promise<string> {
    return ClipboardService.Read();
  }

  writeClipboard(text: string): Promise<void> {
    return ClipboardService.Write(text);
  }

  simulateShortcut(): Promise<void> {
    if (!isDevMode()) return Promise.resolve();
    return SimulateService.SimulateShortcut();
  }

  ngOnDestroy(): void {
    this.unsubscribers.forEach(fn => fn());
    this.shortcutTriggered.complete();
    this.settingsChanged.complete();
  }
}
