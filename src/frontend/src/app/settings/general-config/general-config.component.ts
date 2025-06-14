import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-general-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './general-config.component.html',
  styleUrls: ['./general-config.component.scss']
})
export class GeneralConfigComponent {
  // Default values - these would typically come from a settings service
  autostart = false;
  silentFixShortcut = 'CommandOrControl+Shift+F';
  uiAssistantShortcut = 'CommandOrControl+G';

  // Methods to handle settings changes
  onAutostartChange(): void {
    // Save autostart setting
    console.log('Autostart changed:', this.autostart);
    // In a real implementation, this would call a service to save the setting
  }

  onShortcutChange(shortcutType: string, value: string): void {
    // Save shortcut setting
    console.log(`${shortcutType} shortcut changed to:`, value);
    // In a real implementation, this would call a service to save the setting
  }
}