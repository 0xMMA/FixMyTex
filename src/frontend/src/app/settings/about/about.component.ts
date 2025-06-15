import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { openUrl as osOpenUrl } from '@tauri-apps/plugin-opener';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  /**
   * Open a URL in the default browser
   * @param url The URL to open
   */
  async openUrl(url: string): Promise<void> {
    try {
      await osOpenUrl(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  }
}
