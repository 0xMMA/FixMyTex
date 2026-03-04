import { Injectable } from '@angular/core';
import { MessageBusService } from './message-bus.service';
import { ShortcutManager } from '../shortcut-manager';

/**
 * Service wrapper for ShortcutManager
 * This allows the ShortcutManager to be injected as a service
 */
@Injectable({
  providedIn: 'root'
})
export class ShortcutManagerService {
  private shortcutManager: ShortcutManager;

  constructor(private messageBus: MessageBusService) {
    this.shortcutManager = new ShortcutManager(this.messageBus);
    
    // Initialize shortcuts
    this.shortcutManager.registerShortcuts().catch(error => {
      console.error('Failed to register shortcuts:', error);
    });
  }

  /**
   * Get the underlying ShortcutManager instance
   */
  public getShortcutManager(): ShortcutManager {
    return this.shortcutManager;
  }
}