import { Injectable } from '@angular/core';
import { SettingsService } from './settings.service';
import { marked } from 'marked';
import dedent from 'dedent';

/**
 * Service for handling HTML clipboard operations
 */
@Injectable({
  providedIn: 'root'
})
export class HtmlClipboardService {

  constructor(private settingsService: SettingsService) {}

  /**
   * Check if the given app name supports HTML clipboard
   * @param appName The name of the application
   * @returns True if the app supports HTML clipboard
   */
  public supportsHtmlClipboard(appName: string): boolean {
    const settings = this.settingsService.getSettings();
    
    // If HTML clipboard support is disabled, return false
    if (!settings.htmlClipboardSupport.enabled) {
      return false;
    }

    // Check if the app name contains any of the configured patterns (case-insensitive)
    return settings.htmlClipboardSupport.appPatterns.some(pattern => 
      appName.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Convert markdown text to HTML
   * @param markdownText The markdown text to convert
   * @returns The HTML string
   */
  public async convertMarkdownToHtml(markdownText: string): Promise<string> {
    try {
      // Configure marked for lightweight HTML output
      marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true // Convert line breaks to <br>
      });

      // Convert markdown to HTML
      const html = await marked(markdownText);
      console.log('HTML:', html);
      
      // Add compact styling for better rendering across all applications
      const style = dedent`<style>
        ul, ol { margin: 0 0 12px 0 !important; padding-left: 20px !important; }
        li { margin: 0 !important; margin-left: 20px !important; padding: 0 !important; padding-left: 20px !important; line-height: 1.2 !important; }
        p { margin: 0 !important; margin-bottom: 8px !important; }
        </style>`;
      
      // Wrap the HTML with the styles for compact, nice rendering
      const styledHtml = `${style}${html}`;
      
      return styledHtml;

    } catch (error) {
      console.error('Error converting markdown to HTML:', error);
      // Return the original text if conversion fails
      return markdownText;
    }
  }
}