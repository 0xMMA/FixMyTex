import { Subject } from 'rxjs';
import { vi } from 'vitest';
import type { Settings, KeyStatus } from '../app/core/wails.service';

export const defaultSettings: Settings = {
  active_provider: 'openai',
  providers: {
    ollama_url: '',
    aws_region: '',
  },
  shortcut_key: 'ctrl+g',
  start_on_boot: false,
  theme_preference: 'dark',
  completed_setup: false,
};

export const defaultKeyStatus: KeyStatus = { is_set: false, source: 'none' };

export function createWailsMock() {
  const shortcutTriggered$ = new Subject<string>();
  const settingsChanged$ = new Subject<void>();

  return {
    shortcutTriggered$: shortcutTriggered$.asObservable(),
    settingsChanged$: settingsChanged$.asObservable(),
    // Expose subjects so tests can trigger events
    _shortcutTriggered$: shortcutTriggered$,
    _settingsChanged$: settingsChanged$,

    loadSettings: vi.fn().mockResolvedValue({ ...defaultSettings }),
    saveSettings: vi.fn().mockResolvedValue(undefined),
    isFirstRun: vi.fn().mockResolvedValue(false),
    completeSetup: vi.fn().mockResolvedValue(undefined),
    readClipboard: vi.fn().mockResolvedValue('clipboard text'),
    writeClipboard: vi.fn().mockResolvedValue(undefined),
    enhance: vi.fn().mockResolvedValue('Enhanced text.'),
    simulateShortcut: vi.fn().mockResolvedValue(undefined),
    getKeyStatus: vi.fn().mockResolvedValue({ ...defaultKeyStatus }),
    getKey: vi.fn().mockResolvedValue(''),
    setKey: vi.fn().mockResolvedValue(undefined),
    deleteKey: vi.fn().mockResolvedValue(undefined),
    resetSettings: vi.fn().mockResolvedValue(undefined),
    ngOnDestroy: vi.fn(),
  };
}

export type WailsMock = ReturnType<typeof createWailsMock>;
