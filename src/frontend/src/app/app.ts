import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Event } from '@tauri-apps/api/event';
import { Window } from '@tauri-apps/api/window';
import { ShortcutManager } from './shortcut-manager';
import { MessageBusService } from './services/message-bus.service';
import { SingleClickHandler } from './handlers/single-click-handler';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'FixMyTex';
  private shortcutManager: ShortcutManager;


  constructor(
    private messageBus: MessageBusService,
    private singleClickHandler: SingleClickHandler
  ) {
    // Pass the message bus to the shortcut manager
    this.shortcutManager = new ShortcutManager(this.messageBus);
  }

  async ngOnInit() {
    // Initialize the single click handler
    this.singleClickHandler.initialize();

    // Register shortcuts
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
