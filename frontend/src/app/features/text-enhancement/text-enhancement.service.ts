import { Injectable } from '@angular/core';
import { WailsService, Settings as AppSettings } from '../../core/wails.service';

/**
 * TextEnhancementService calls the configured AI provider to improve text.
 * Provider logic is implemented directly here using fetch; LangChain.js can
 * replace the individual provider calls in a future iteration.
 */
@Injectable({ providedIn: 'root' })
export class TextEnhancementService {
  constructor(private readonly wails: WailsService) {}

  async enhance(text: string): Promise<string> {
    const settings = await this.wails.loadSettings();
    if (!settings) throw new Error('Settings not loaded');

    switch (settings.active_provider) {
      case 'openai':
        return this.callOpenAI(text, settings);
      case 'claude':
        return this.callClaude(text, settings);
      case 'ollama':
        return this.callOllama(text, settings);
      default:
        throw new Error(`Unknown provider: ${settings.active_provider}`);
    }
  }

  private async callOpenAI(text: string, settings: AppSettings): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.providers.openai_key}`,
        'Content-Type': 'application/json',
      },
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

  private async callClaude(text: string, settings: AppSettings): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': settings.providers.claude_key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
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

  private async callOllama(text: string, settings: AppSettings): Promise<string> {
    const base = settings.providers.ollama_url || 'http://localhost:11434';
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
