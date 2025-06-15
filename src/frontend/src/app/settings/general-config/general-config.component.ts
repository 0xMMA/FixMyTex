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
  silentFixShortcut = 'CommandOrControl+Shift+F';
  uiAssistantShortcut = 'CommandOrControl+G';

  private subscription: Subscription = new Subscription();

  constructor(private settingsService: SettingsService) {}

  ngOnInit(): void {
    // Subscribe to settings changes
    this.subscription.add(
      this.settingsService.settings$.subscribe(settings => {
        this.autostart = settings.autostart;
        this.silentFixShortcut = settings.shortcuts.silentFix;
        this.uiAssistantShortcut = settings.shortcuts.uiAssistant;
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

  onShortcutChange(shortcutType: string, value: string): void {
    // Save shortcut setting using the settings service
    if (shortcutType === 'Silent Fix') {
      this.settingsService.updateShortcut('silentFix', value).catch(error => {
        console.error('Error updating silent fix shortcut:', error);
      });
    } else if (shortcutType === 'UI Assistant') {
      this.settingsService.updateShortcut('uiAssistant', value).catch(error => {
        console.error('Error updating UI assistant shortcut:', error);
      });
    }
  }
}
