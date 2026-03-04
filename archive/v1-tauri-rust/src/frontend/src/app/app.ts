import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, Event as RouterEvent } from '@angular/router';
//import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { Event as TauriEvent } from '@tauri-apps/api/event';
import { Window } from '@tauri-apps/api/window';
//import { MessageBusService } from './services/message-bus.service';
import { SilentFixActionHandler } from './handlers/silent-fix-action-handler';
import { UIAssistedActionHandler } from './handlers/ui-assisted-action-handler';
//import { ShortcutManagerService } from './services/shortcut-manager.service';
import { filter } from 'rxjs/operators';
import { LangChainService } from './services/langchain.service';
import { SettingsService } from './services/settings.service';
import { invoke } from '@tauri-apps/api/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'FixMyTex';
  isMainPage = false; // Track if we're on the main page


  constructor(
    //private messageBus: MessageBusService,
    private silentFixActionHandler: SilentFixActionHandler,
    private uiAssistedActionHandler: UIAssistedActionHandler,
    //private shortcutManagerService: ShortcutManagerService,
    private router: Router,
    //private location: Location
    private langChainService: LangChainService,
    private settingsService: SettingsService
  ) {}

  async ngOnInit() {
    // Initialize the action handlers
    this.silentFixActionHandler.initialize();
    this.uiAssistedActionHandler.initialize();

    // ShortcutManager is initialized in the ShortcutManagerService
    await this.setupWindowEvents();

    // Subscribe to router events to track when we're on the main page
    this.router.events.pipe(
      filter((event: RouterEvent) => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Check if we're on the main page (assistant route)
      this.isMainPage = event.url === '/assistant' || event.url === '/';
    });

    // Check the initial route
    const currentUrl = this.router.url;
    this.isMainPage = currentUrl === '/assistant' || currentUrl === '/';

    // Listen for the custom navigation event from the tray menu
    window.addEventListener('navigate-to-settings', () => {
      console.log('Received navigate-to-settings event');
      this.navigateToSettings();
    });

    // Check if we should start minimized or show settings
    await this.checkStartupConditions();
  }


  private async setupWindowEvents() {
    try {
      const appWindow = Window.getCurrent();

      // Listen for the window minimize events
      await appWindow.listen('tauri://window-event', async (event: TauriEvent<any>) => {
        console.log('Window state changed:', event.payload)
        // const appWindow = Window.getCurrent();
        // if (event.payload === 'minimize') {
        //   // Hide to the tray instead of minimizing
        //   await appWindow.hide();
        //   console.log('Window minimized to the tray');
        // }
      });
    } catch (error) {
      console.error('Failed to setup window events:', error);
    }
  }

  /**
   * Navigate to the settings page
   * @param section Optional section to show (e.g., 'api')
   */
  navigateToSettings(section?: string): void {
    const route = section ? `/settings/${section}` : '/settings';
    this.router.navigate([route]).catch(error => {
        console.error(`Failed to navigate to ${route}:`, error);
    });
  }

  /**
   * Check startup conditions to determine if we should show the window or start minimized
   */
  private async checkStartupConditions(): Promise<void> {
    try {
      // Get the current settings
      const settings = this.settingsService.getSettings();

      // Check if startMinimized is enabled
      if (settings.startMinimized) {
        // Check if API key is set
        const config = this.langChainService.getConfig();
        let apiKeySet = false;

        if (config.provider) {
          try {
            // Try to get the API key from the keyring
            const apiKey = await invoke<string>('get_api_key', { provider: config.provider });
            apiKeySet = !!apiKey; // Convert to boolean
          } catch (error) {
            console.warn('Could not check API key:', error);
            apiKeySet = false;
          }
        }

        if (!apiKeySet) {
          console.log('No API key set, showing settings page');
          // No API key set, show the settings page with API config section
          const appWindow = Window.getCurrent();
          await appWindow.show();
          this.navigateToSettings('api');
        } else {
          console.log('API key is set, starting minimized');
          // API key is set, start minimized if enabled
          const appWindow = Window.getCurrent();
          await appWindow.hide();
        }
      }
    } catch (error) {
      console.error('Error checking startup conditions:', error);
    }
  }

  /**
   * Navigate back to the previous page
   */
  navigateToMain(): void {
     this.router.navigate(['/assistant']).catch(error => {
       console.error('Failed to navigate to assistant page:', error);
     })
  }
}
