import { Injectable } from '@angular/core';
import { MessageBusService } from '../services/message-bus.service';
import { LangChainService } from '../services/langchain.service';
import { writeText, readText, writeHtml } from '@tauri-apps/plugin-clipboard-manager';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { ShortcutEventType } from './silent-fix-action-handler';
import { HtmlClipboardService } from '../services/html-clipboard.service';

/**
 * Data structure for UI assisted action
 */
export interface UIAssistedActionData {
  text: string;
  sourceApp: string;
}

/**
 * Handler for UI assisted action events
 */
@Injectable({
  providedIn: 'root'
})
export class UIAssistedActionHandler {
  private sourceApp: string = '';
  private originalText: string = '';

  constructor(
    private messageBus: MessageBusService,
    private langChainService: LangChainService,
    private htmlClipboardService: HtmlClipboardService
  ) {
    // Subscribe to ui-assisted events
    this.messageBus.on<void>(ShortcutEventType.UI_ASSISTED)
      .subscribe(() => this.handleUIAssisted());
  }

  /**
   * Initialize the handler
   * This method should be called once during application startup
   */
  initialize(): void {
    console.log('UIAssistedActionHandler initialized');
  }

  /**
   * Get the source application name
   * @returns The name of the application where the text was copied from
   */
  getSourceApp(): string {
    return this.sourceApp;
  }

  /**
   * Get the original text
   * @returns The original text that was copied
   */
  getOriginalText(): string {
    return this.originalText;
  }

  /**
   * Handle a UI assisted action event
   * This method shows the application window and captures text and the source application for UI-assisted processing
   */
  private async handleUIAssisted(): Promise<void> {
    try {
      console.log('UI assisted action detected');


      // Get the current focused application name via the operating system
      this.sourceApp = await invoke<string>('get_focused_app_name');
      console.log('Focused application:', this.sourceApp);

      // Send Ctrl+C / copy command via the operating system to the current focused application
      await invoke('send_copy_command');
      console.log('Copy command sent');

      // Wait a moment for the copy operation to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get text from the clipboard
      this.originalText = await this.getClipboardText();

      if (!this.originalText) {
        console.log('No text in clipboard');
        return;
      }

      console.log('Captured clipboard text for UI assisted processing');

      await this.showApplicationWindow();

      // Notify any subscribers that we have text ready for UI processing
      this.messageBus.publish('ui-assisted:text-ready', {
        text: this.originalText,
        sourceApp: this.sourceApp
      } as UIAssistedActionData);

      // Note: The UI component will handle the actual processing and pasting back
    } catch (error) {
      console.error('Error handling UI assisted action:', error);
    }
  }

  /**
   * Show the application window
   * This method was moved from shortcut-manager.ts handleDoubleClick
   */
  private async showApplicationWindow(): Promise<void> {
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
   * Paste text back to the original application
   * @param text The text to paste
   */
  async pasteBackToSourceApp(text: string): Promise<void> {
    try {
      // Analyse if app to which we want to paste back supports html clipboard
      // we do this with a good old regex and let that come from settings
      const supportsHtml = this.htmlClipboardService.supportsHtmlClipboard(this.sourceApp);
      console.log(`App ${this.sourceApp} HTML clipboard support: ${supportsHtml}`);

      let clipboardText = text;
      let clipboardHtml: string | undefined;

      if (supportsHtml) {
        // if it does, we write the text to the clipboard as html 
        // we need a package that takes our markdown and converts it to light weight html like h1 and ul should already be good enough
        try {
          clipboardHtml = await this.htmlClipboardService.convertMarkdownToHtml(text);
          console.log('Converted text to HTML for clipboard');
        } catch (error) {
          console.error('Error converting to HTML, falling back to plain text:', error);
          clipboardHtml = undefined;
        }
      } else {
        // if it does not, we write the text to the clipboard as plain text
        clipboardText = text;
      }

      // Write the processed text to the clipboard
      if (supportsHtml && clipboardHtml) {
        // Write HTML to clipboard with plain text fallback
        await writeHtml(clipboardHtml, text);
        console.log('HTML written to clipboard');
      } else {
        // Write plain text to clipboard
        await this.setClipboardText(clipboardText);
        console.log('Plain text written to clipboard');
      }

      // Send Ctrl+V / paste command via the operating system to the source application
      // Pass the source app name so the backend can try to find and focus the window
      await invoke('send_paste_command', { source_app_name: this.sourceApp });
      console.log('Paste command sent to source application:', this.sourceApp);
    } catch (error) {
      console.error('Error pasting back to source application:', error);
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
