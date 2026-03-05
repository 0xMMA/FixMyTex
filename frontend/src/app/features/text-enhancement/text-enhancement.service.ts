import { Injectable } from '@angular/core';
import { WailsService } from '../../core/wails.service';

@Injectable({ providedIn: 'root' })
export class TextEnhancementService {
  constructor(private readonly wails: WailsService) {}

  async enhance(text: string): Promise<string> {
    try {
      // Primary path: Go backend handles the API call (no WebView network-policy issues).
      return await this.wails.enhance(text);
    } catch (backendErr: unknown) {
      // If the Wails runtime is unavailable (browser dev / Playwright mode) the call throws
      // synchronously before returning a promise. Fall back to direct fetch in that case.
      // In the real Wails app this branch is never reached — backend errors propagate as-is.
      if (this.isWailsUnavailableError(backendErr)) {
        return this.enhanceBrowserFallback(text);
      }
      throw backendErr;
    }
  }

  // Returns true when the error indicates the Wails runtime is simply not present
  // (browser dev mode), as opposed to a real backend error.
  private isWailsUnavailableError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.includes('wails') || msg.includes('Call') || msg.includes('runtime');
  }

  // Browser-mode fallback: calls the AI provider API directly from the browser.
  // Used by Playwright E2E tests (with page.route() CORS proxy) and ng-serve dev.
  private async enhanceBrowserFallback(text: string): Promise<string> {
    const settings = await this.wails.loadSettings();

    switch (settings.active_provider) {
      case 'openai':
        return this.callOpenAI(text, await this.wails.getKey('openai'));
      case 'claude':
        return this.callClaude(text);
      case 'ollama':
        return this.callOllama(text, settings.providers.ollama_url);
      case 'bedrock':
        throw new Error('AWS Bedrock is not yet supported. Please select a different provider.');
      default:
        throw new Error(`Unknown provider: ${settings.active_provider}`);
    }
  }

  private async callOpenAI(text: string, apiKey: string): Promise<string> {
    if (!apiKey) throw new Error('OpenAI API key is not configured. Go to Settings → AI Providers to add it.');
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a professional text editor. Fix grammar, spelling, and improve clarity. Return only the improved text.' },
          { role: 'user', content: text },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${res.status} ${res.statusText}`);
    const json = await res.json() as { choices: Array<{ message: { content: string } }> };
    return json.choices[0].message.content;
  }

  private async callClaude(text: string): Promise<string> {
    // In Playwright/browser-dev mode: read key from localStorage (injected by test).
    const apiKey = typeof localStorage !== 'undefined' ? localStorage.getItem('_e2e_apikey_claude') ?? '' : '';
    if (!apiKey) throw new Error(
      'Anthropic API key is not configured for browser mode. ' +
      'In the desktop app the key is read from the OS keyring automatically.',
    );
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2048,
        system: 'You are a professional text editor. Fix grammar, spelling, and improve clarity. Return only the improved text.',
        messages: [{ role: 'user', content: text }],
      }),
    });
    if (!res.ok) throw new Error(`Claude error: ${res.status} ${res.statusText}`);
    const json = await res.json() as { content: Array<{ text: string }> };
    return json.content[0].text;
  }

  private async callOllama(text: string, baseUrl: string): Promise<string> {
    const base = baseUrl || 'http://localhost:11434';
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: `Fix grammar, spelling, and improve clarity. Return only the improved text.\n\nText: ${text}`,
        stream: false,
      }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
    const json = await res.json() as { response: string };
    return json.response;
  }
}
