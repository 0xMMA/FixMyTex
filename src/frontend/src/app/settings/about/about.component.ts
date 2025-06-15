import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { openUrl as osOpenUrl } from '@tauri-apps/plugin-opener';
import { getVersion } from '@tauri-apps/api/app';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit {
  appVersion: string = '';
  updateAvailable: boolean = false;
  updateVersion: string = '';
  checkingForUpdate: boolean = false;
  updateError: string = '';
  currentUpdate: any = null;

  async ngOnInit(): Promise<void> {
    try {
      this.appVersion = await getVersion();
    } catch (error) {
      console.error('Error getting app version:', error);
      this.appVersion = 'Unknown';
    }
  }

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

  /**
   * Check for updates
   */
  async checkForUpdate(): Promise<void> {
    this.checkingForUpdate = true;
    this.updateError = '';
    this.currentUpdate = null;

    try {
      const update = await check();
      if (update) {
        this.updateAvailable = true;
        this.updateVersion = update.version;
        this.currentUpdate = update;
        console.log(`Found update ${update.version} from ${update.date} with notes ${update.body}`);
      } else {
        this.updateAvailable = false;
        this.updateVersion = '';
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      this.updateError = 'Failed to check for updates';
    } finally {
      this.checkingForUpdate = false;
    }
  }

  /**
   * Install available update
   */
  async installAvailableUpdate(): Promise<void> {
    if (!this.currentUpdate) {
      this.updateError = 'No update available to install';
      return;
    }

    try {
      let downloaded = 0;
      let contentLength = 0;

      await this.currentUpdate.downloadAndInstall((event: { event: any; data: { contentLength: number; chunkLength: number; }; }) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength;
            console.log(`Started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            console.log(`Downloaded ${downloaded} from ${contentLength}`);
            break;
          case 'Finished':
            console.log('Download finished');
            break;
        }
      });

      console.log('Update installed');
      await relaunch();
    } catch (error) {
      console.error('Error installing update:', error);
      this.updateError = 'Failed to install update';
    }
  }
}
