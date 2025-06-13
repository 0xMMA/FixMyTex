import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Event } from '@tauri-apps/api/event';
import { Window } from '@tauri-apps/api/window';
import { ShortcutManager } from './shortcut-manager';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'FixMyText';
  private shortcutManager: ShortcutManager;


  constructor() {
    this.shortcutManager = new ShortcutManager();
  }

  async ngOnInit() {
    await this.shortcutManager.registerShortcuts();
    await this.setupWindowEvents();
  }


  private async setupWindowEvents() {
    try {
      const appWindow = Window.getCurrent();

      // Listen for the window minimize events
      await appWindow.listen('tauri://window-event', async (event: Event<any>) => {
        console.log('Window state changed:', event.payload)
        // const appWindow = Window.getCurrent();
        // if (event.payload === 'minimize') {
        //   // Hide to the tray instead of minimizing
        //   await appWindow.hide();
        //   console.log('Window minimized to tray');
        // }
      });
    } catch (error) {
      console.error('Failed to setup window events:', error);
    }
  }
}
