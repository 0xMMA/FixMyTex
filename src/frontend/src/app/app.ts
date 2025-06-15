import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Event } from '@tauri-apps/api/event';
import { Window } from '@tauri-apps/api/window';
import { ShortcutManager } from './shortcut-manager';
import { MessageBusService } from './services/message-bus.service';
import { SingleClickHandler } from './handlers/single-click-handler';
import { filter } from 'rxjs/operators';

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
  isMainPage = false; // Track if we're on the main page


  constructor(
    private messageBus: MessageBusService,
    private singleClickHandler: SingleClickHandler,
    private router: Router,
    private location: Location
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

    // Subscribe to router events to track when we're on the main page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check if we're on the main page (assistant route)
      this.isMainPage = event.url === '/assistant' || event.url === '/';
    });

    // Check initial route
    const currentUrl = this.router.url;
    this.isMainPage = currentUrl === '/assistant' || currentUrl === '/';

    // Listen for the custom navigation event from the tray menu
    window.addEventListener('navigate-to-settings', () => {
      console.log('Received navigate-to-settings event');
      this.navigateToSettings();
    });
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

  /**
   * Navigate to the settings page
   */
  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  /**
   * Navigate back to the previous page
   */
  goBack(): void {
    this.location.back();
  }
}
