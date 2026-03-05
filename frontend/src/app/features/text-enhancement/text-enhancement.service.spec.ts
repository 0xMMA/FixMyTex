import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TextEnhancementService } from './text-enhancement.service';
import { WailsService } from '../../core/wails.service';
import { createWailsMock, defaultSettings } from '../../../testing/wails-mock';

describe('TextEnhancementService', () => {
  let svc: TextEnhancementService;
  let wailsMock: ReturnType<typeof createWailsMock>;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    wailsMock = createWailsMock();
    // Default: backend enhance succeeds
    wailsMock.enhance.mockResolvedValue('Backend enhanced text.');

    TestBed.configureTestingModule({
      providers: [
        TextEnhancementService,
        { provide: WailsService, useValue: wailsMock },
      ],
    });
    svc = TestBed.inject(TextEnhancementService);

    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Primary path: Go backend ---

  it('delegates to wails.enhance() and returns the result', async () => {
    const result = await svc.enhance('bad grammer');
    expect(wailsMock.enhance).toHaveBeenCalledWith('bad grammer');
    expect(result).toBe('Backend enhanced text.');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('propagates backend errors to the caller', async () => {
    wailsMock.enhance.mockRejectedValue(new Error('Anthropic API key is not configured'));
    await expect(svc.enhance('text')).rejects.toThrow('Anthropic API key is not configured');
  });

  // --- Browser-mode fallback path (Wails runtime unavailable) ---

  it('falls back to direct OpenAI fetch when Wails runtime is unavailable', async () => {
    // Simulate Wails runtime not initialised (synchronous-style error message)
    wailsMock.enhance.mockRejectedValue(new Error('Call is not a function (wails runtime)'));
    wailsMock.loadSettings.mockResolvedValue({ ...defaultSettings, active_provider: 'openai' });
    wailsMock.getKey.mockResolvedValue('sk-test-key');

    const mockResponse = { choices: [{ message: { content: 'OpenAI fixed.' } }] };
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await svc.enhance('bad text');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toBe('OpenAI fixed.');
  });

  it('falls back to direct Ollama fetch when Wails runtime is unavailable', async () => {
    wailsMock.enhance.mockRejectedValue(new Error('wails runtime not available'));
    wailsMock.loadSettings.mockResolvedValue({
      ...defaultSettings,
      active_provider: 'ollama',
      providers: { ollama_url: 'http://localhost:11434', aws_region: '' },
    });
    const mockResponse = { response: 'Ollama fixed.' };
    fetchSpy.mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

    const result = await svc.enhance('some text');

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:11434/api/generate',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toBe('Ollama fixed.');
  });

  it('throws for unknown provider in browser fallback', async () => {
    wailsMock.enhance.mockRejectedValue(new Error('wails runtime error'));
    wailsMock.loadSettings.mockResolvedValue({ ...defaultSettings, active_provider: 'unknown' as never });

    await expect(svc.enhance('text')).rejects.toThrow('Unknown provider: unknown');
  });
});
