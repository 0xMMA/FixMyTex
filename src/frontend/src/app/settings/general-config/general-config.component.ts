import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './general-config.component.html',
  styleUrls: ['./general-config.component.scss']
})
export class GeneralConfigComponent implements OnInit, OnDestroy {
  // Settings values
  autostart = false;
  startMinimized = true;
  silentFixShortcut = 'CommandOrControl+G';
  uiAssistantShortcut = 'CommandOrControl+G';
  htmlClipboardEnabled = true;
  htmlClipboardAppPatterns = '';

  private subscription: Subscription = new Subscription();

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    // Subscribe to settings changes
    this.subscription.add(
      this.settingsService.settings$.subscribe(settings => {
        this.autostart = settings.autostart;
        this.startMinimized = settings.startMinimized;
        this.silentFixShortcut = settings.shortcuts.silentFix;
        this.uiAssistantShortcut = settings.shortcuts.uiAssistant;
        this.htmlClipboardEnabled = settings.htmlClipboardSupport.enabled;
        this.htmlClipboardAppPatterns = settings.htmlClipboardSupport.appPatterns.join('\n');
      })
    );
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    this.subscription.unsubscribe();
  }

  // Methods to handle settings changes
  onAutostartChange(): void {
    // Save autostart setting using the settings service
    this.settingsService.updateAutostart(this.autostart).catch(error => {
      console.error('Error updating autostart setting:', error);
    });
  }

  onStartMinimizedChange(): void {
    // Save startMinimized setting using the settings service
    this.settingsService.updateStartMinimized(this.startMinimized).catch(error => {
      console.error('Error updating start minimized setting:', error);
    });
  }

  /**
   * Handle shortcut change
   * @param shortcutType The type of shortcut being changed
   * @param value The new shortcut value
   */
  onShortcutChange(shortcutType: string, value: string): void {
    if (shortcutType === 'Silent Fix') {
      this.settingsService.updateShortcut('silentFix', value);
    } else if (shortcutType === 'UI Assistant') {
      this.settingsService.updateShortcut('uiAssistant', value);
    }
  }

  /**
   * Handle HTML clipboard enabled change
   */
  onHtmlClipboardEnabledChange(): void {
    const appPatterns = this.htmlClipboardAppPatterns
      .split('\n')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0);
    
    this.settingsService.updateHtmlClipboardSupport(this.htmlClipboardEnabled, appPatterns);
  }

  /**
   * Handle HTML clipboard app patterns change
   */
  onHtmlClipboardAppPatternsChange(): void {
    const appPatterns = this.htmlClipboardAppPatterns
      .split('\n')
      .map(pattern => pattern.trim())
      .filter(pattern => pattern.length > 0);
    
    this.settingsService.updateHtmlClipboardSupport(this.htmlClipboardEnabled, appPatterns);
  }

}
