import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ShortcutConfig } from '../shortcut-manager';
import { ShortcutManagerService } from './shortcut-manager.service';
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';

/**
 * Interface for application settings
 */
export interface AppSettings {
  autostart: boolean;
  startMinimized: boolean;
  shortcuts: {
    silentFix: string;
    uiAssistant: string;
  };
}

/**
 * Default application settings
 */
export const DEFAULT_SETTINGS: AppSettings = {
  autostart: false,
  startMinimized: true,
  shortcuts: {
    silentFix: 'CommandOrControl+G',
    uiAssistant: 'CommandOrControl+G'
  }
};

/**
 * Service for managing application settings
 */
@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settingsSubject = new BehaviorSubject<AppSettings>(DEFAULT_SETTINGS);

  /**
   * Observable for the current settings
   */
  public settings$: Observable<AppSettings> = this.settingsSubject.asObservable();

  constructor(private shortcutManagerService: ShortcutManagerService) {
    // Load saved settings from storage if available
    this.loadSettings().catch(error => {
      console.error('Error loading settings:', error);
    });
  }

  /**
   * Get the current settings
   */
  public getSettings(): AppSettings {
    return this.settingsSubject.getValue();
  }

  /**
   * Update the application settings
   * @param settings The new settings
   */
  public async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const currentSettings = this.settingsSubject.getValue();
    const newSettings = { ...currentSettings, ...settings };

    // Update the settings subject
    this.settingsSubject.next(newSettings);

    // Save the settings to storage
    await this.saveSettings(newSettings).catch(error => {
      console.error('Error saving settings:', error);
    });

    // Update shortcuts if they've changed
    if (settings.shortcuts) {
      await this.updateShortcuts(newSettings.shortcuts).catch(error => {
        console.error('Error updating shortcuts:', error);
      });
    }
  }

  /**
   * Update a specific shortcut
   * @param shortcutType The type of shortcut to update
   * @param value The new shortcut value
   */
  public async updateShortcut(shortcutType: 'silentFix' | 'uiAssistant', value: string): Promise<void> {
    const currentSettings = this.settingsSubject.getValue();
    const newSettings = { 
      ...currentSettings, 
      shortcuts: { 
        ...currentSettings.shortcuts, 
        [shortcutType]: value 
      } 
    };

    // Update the settings subject
    this.settingsSubject.next(newSettings);

    // Save the settings to storage
    await this.saveSettings(newSettings).catch(error => {
      console.error('Error saving settings:', error);
    });

    // Update the shortcut manager
    await this.updateShortcuts(newSettings.shortcuts).catch(error => {
      console.error('Error updating shortcuts:', error);
    });
  }

  /**
   * Update the autostart setting
   * @param value The new autostart value
   */
  public async updateAutostart(value: boolean): Promise<void> {
    const currentSettings = this.settingsSubject.getValue();
    const newSettings = { ...currentSettings, autostart: value };

    // Update the settings subject
    this.settingsSubject.next(newSettings);

    // Save the settings to storage
    await this.saveSettings(newSettings).catch(error => {
      console.error('Error saving settings:', error);
    });

    // Update the autostart setting in Tauri
    try {
      if (value) {
        // Enable autostart
        await enable();
        console.log('Autostart enabled');
      } else {
        // Disable autostart
        await disable();
        console.log('Autostart disabled');
      }
    } catch (error) {
      console.error('Error updating autostart setting:', error);
    }
  }

  /**
   * Update the startMinimized setting
   * @param value The new startMinimized value
   */
  public async updateStartMinimized(value: boolean): Promise<void> {
    const currentSettings = this.settingsSubject.getValue();
    const newSettings = { ...currentSettings, startMinimized: value };

    // Update the settings subject
    this.settingsSubject.next(newSettings);

    // Save the settings to storage
    await this.saveSettings(newSettings).catch(error => {
      console.error('Error saving settings:', error);
    });
  }

  /**
   * Load settings from storage
   */
  private async loadSettings(): Promise<void> {
    try {
      const savedSettings = localStorage.getItem('app_settings');
      let settings = DEFAULT_SETTINGS;

      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        settings = { ...settings, ...parsedSettings };
      }

      // Check the actual autostart status from Tauri
      try {
        const autostartEnabled = await isEnabled();
        // Update the autostart setting to reflect the actual status
        settings.autostart = autostartEnabled;
        console.log(`Autostart status checked: ${autostartEnabled}`);
      } catch (autostartError) {
        console.error('Error checking autostart status:', autostartError);
      }

      this.settingsSubject.next(settings);

      // Update shortcuts in the shortcut manager
      await this.updateShortcuts(settings.shortcuts);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  /**
   * Save settings to storage
   * @param settings The settings to save
   */
  private async saveSettings(settings: AppSettings): Promise<void> {
    try {
      localStorage.setItem('app_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  /**
   * Update shortcuts in the shortcut manager
   * @param shortcuts The shortcuts to update
   */
  private async updateShortcuts(shortcuts: AppSettings['shortcuts']): Promise<void> {
    try {
      // Get the shortcut manager instance
      const shortcutManager = this.shortcutManagerService.getShortcutManager();

      // Update the UI Assistant shortcut in the shortcut manager
      const shortcutConfig: Partial<ShortcutConfig> = {
        actionShortcut: shortcuts.uiAssistant
      };

      await shortcutManager.updateConfig(shortcutConfig);

    } catch (error) {
      console.error('Error updating shortcuts:', error);
    }
  }
}
