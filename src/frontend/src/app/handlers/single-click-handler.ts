import { Injectable } from '@angular/core';
import { MessageBusService } from '../services/message-bus.service';
import { LangChainService } from '../services/langchain.service';
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';

/**
 * Message types for shortcut events
 */
export enum ShortcutEventType {
  SINGLE_CLICK = 'shortcut:single-click',
}

/**
 * Handler for single click shortcut events
 */
@Injectable({
  providedIn: 'root'
})
export class SingleClickHandler {
  constructor(
    private messageBus: MessageBusService,
    private langChainService: LangChainService
  ) {
    // Subscribe to single-click events
    this.messageBus.on<void>(ShortcutEventType.SINGLE_CLICK)
      .subscribe(() => this.handleSingleClick());
  }

  /**
   * Initialize the handler
   * This method should be called once during application startup
   */
  initialize(): void {
    console.log('SingleClickHandler initialized');
  }

  /**
   * Handle a single click event
   * This method contains the implementation that was previously in ShortcutManager.handleSingleClick
   */
  private async handleSingleClick(): Promise<void> {
    try {
      console.log('Single click detected');

      // Get the current focused application name via the operating system
      const focusedApp = await invoke<string>('get_focused_app_name');
      console.log('Focused application:', focusedApp);

      // Send Ctrl+C / copy command via the operating system to the current focused application
      await invoke('send_copy_command');
      console.log('Copy command sent');

      // Wait a moment for the copy operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get text from the clipboard
      const clipboardText = await this.getClipboardText();

      if (!clipboardText) {
        console.log('No text in clipboard');
        return;
      }

      console.log('Processing clipboard text:', clipboardText);

      // Process text using LangChain
      const processedText = await this.langChainService.fixTextSilent(clipboardText);

      // Write processed text back to the clipboard
      await this.setClipboardText(processedText);

      // Send Ctrl+V / paste command via the operating system to the current focused application
      try {
        await invoke('send_paste_command');
        console.log('Paste command sent');
      } catch (error) {
        console.error('Error sending paste command:', error);
        // Even if paste fails, we've already processed the text and it's in the clipboard
      }

      console.log('Text processed and copied to clipboard');
    } catch (error) {
      console.error('Error handling single click:', error);
    }
  }

private async getClipboardText(): Promise<string> {
  try {
    return await readText();
  } catch (error) {
    console.error('Error reading from clipboard:', error);
    return '';
  }
}

private async setClipboardText(text: string): Promise<void> {
  try {
    await writeText(text);
  } catch (error) {
    console.error('Error writing to clipboard:', error);
  }
}
}
