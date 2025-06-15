import {register, ShortcutEvent} from '@tauri-apps/plugin-global-shortcut';
import {Window} from '@tauri-apps/api/window';
import { MessageBusService } from './services/message-bus.service';
import { ShortcutEventType } from './handlers/single-click-handler';

export interface ShortcutConfig {
  actionShortcut: string;
  doubleClickThreshold: number;
}

export interface ShortcutAction {
  name: string;
  handler: () => Promise<void>;
}

export class ShortcutManager {
  private recentClicks: number[] = [];
  private pendingClickTimeout: number | null = null;

  constructor(
      private messageBus?: MessageBusService,
      private config: ShortcutConfig = {
        actionShortcut: 'CommandOrControl+G',
        doubleClickThreshold: 200
        // Note: System limitations may prevent detecting clicks faster than ~100-200 ms
        // This is due to OS key repeat rate settings and event processing delays
      }
  ) {}

  async registerShortcuts(): Promise<void> {
    try {
      const showUIAction: ShortcutAction = {
        name: 'showUI',
        handler: (event?: ShortcutEvent) => {
          // If event is provided, check if it's a keydown or keyup
          if (event?.state === 'Released') { // 'Pressed'
            return this.handleClick();
          }
          return Promise.resolve();
        }
      };

      await register(this.config.actionShortcut, showUIAction.handler);
    } catch (error) {
      console.error('Failed to register global shortcut:', error);
    }
  }

  private async handleClick(): Promise<void> {
    const currentTime = Date.now();

    // Always clear any pending single-click timeout first
    this.clearPendingTimeout();

    // Clean up old clicks outside the threshold window
    this.recentClicks = this.recentClicks.filter(
      time => currentTime - time < this.config.doubleClickThreshold
    );

    // Add the current click
    this.recentClicks.push(currentTime);

    // If we have two clicks within the threshold, it's a double-click
    if (this.recentClicks.length >= 2) {
      // Process the double-click immediately
      await this.handleDoubleClick();
      // Reset clicks after processing to prevent further actions
      this.recentClicks = [];
      return;
    }

    // Set a timeout for single-click action
    this.pendingClickTimeout = window.setTimeout(async () => {
      // Only process single click if we still have exactly one click in the array
      // This ensures that if another click came in after setting this timeout
      // but before it executed, we won't trigger a single-click action
      if (this.recentClicks.length === 1) {
        await this.handleSingleClick();
      }
      this.recentClicks = [];
      this.pendingClickTimeout = null;
    }, this.config.doubleClickThreshold);
  }

  private async handleSingleClick(): Promise<void> {
    if (this.messageBus) {
      // Publish a single click event to the message bus
      this.messageBus.publish(ShortcutEventType.SINGLE_CLICK);
    } else {
      // Fallback for backward compatibility
      console.log('MessageBus not available, single click event not published');
      // Add any legacy single click implementation here if needed
    }
  }

  private async handleDoubleClick(): Promise<void> {
    try {
      const appWindow = Window.getCurrent();
      if (await appWindow.isMinimized()) {
        await appWindow.unminimize();
      }
      await appWindow.show();
      await appWindow.setFocus();
      await appWindow.setSkipTaskbar(false);
    } catch (error) {
      console.error('Failed to show window:', error);
    }
  }

  /**
   * Helper method to clear any pending timeout
   */
  private clearPendingTimeout(): void {
    if (this.pendingClickTimeout !== null) {
      clearTimeout(this.pendingClickTimeout);
      this.pendingClickTimeout = null;
    }
  }
  /**
   * Update the shortcut configuration
   * @param newConfig Partial configuration to update
   * @returns Promise that resolves when shortcuts are re-registered
   */
  async updateConfig(newConfig: Partial<ShortcutConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Clear any existing clicks and timeouts
    this.recentClicks = [];
    this.clearPendingTimeout();

    // Re-register shortcuts with new configuration
    await this.registerShortcuts();
  }
}
