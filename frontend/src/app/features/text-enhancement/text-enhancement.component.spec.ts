import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { TextEnhancementComponent } from './text-enhancement.component';
import { TextEnhancementService } from './text-enhancement.service';
import { WailsService } from '../../core/wails.service';
import { createWailsMock } from '../../../testing/wails-mock';

describe('TextEnhancementComponent', () => {
  let fixture: ComponentFixture<TextEnhancementComponent>;
  let component: TextEnhancementComponent;
  let el: HTMLElement;
  let wailsMock: ReturnType<typeof createWailsMock>;
  let enhanceSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    wailsMock = createWailsMock();
    enhanceSpy = vi.fn().mockResolvedValue('Enhanced output.');

    await TestBed.configureTestingModule({
      imports: [TextEnhancementComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: WailsService, useValue: wailsMock },
        { provide: TextEnhancementService, useValue: { enhance: enhanceSpy } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextEnhancementComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  // --- DOM tests ---

  it('renders input and output textareas', () => {
    expect(el.querySelector('[data-testid="input-textarea"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="output-textarea"]')).toBeTruthy();
  });

  it('Enhance button is present and enabled initially', () => {
    const btn = el.querySelector<HTMLButtonElement>('[data-testid="enhance-btn"] button');
    expect(btn).toBeTruthy();
    expect(btn?.disabled).toBe(false);
  });

  it('Enhance button shows loading state while enhancing', async () => {
    let resolveEnhance!: (v: string) => void;
    enhanceSpy.mockReturnValue(new Promise<string>(res => { resolveEnhance = res; }));

    component.inputText = 'some text';
    const enhancePromise = component.enhance();
    fixture.detectChanges();

    const btn = el.querySelector<HTMLButtonElement>('[data-testid="enhance-btn"] button');
    expect(btn?.disabled).toBe(true);

    resolveEnhance('done');
    await enhancePromise;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(el.querySelector<HTMLButtonElement>('[data-testid="enhance-btn"] button')?.disabled).toBe(false);
  });

  it('output textarea shows enhanced text after enhancement', async () => {
    component.inputText = 'bad grammer';
    await component.enhance();
    fixture.detectChanges();
    await fixture.whenStable();

    const output = el.querySelector<HTMLTextAreaElement>('[data-testid="output-textarea"]');
    expect(output?.value).toBe('Enhanced output.');
  });

  it('error message appears in DOM on service failure', async () => {
    enhanceSpy.mockRejectedValue(new Error('API error'));
    component.inputText = 'some text';
    await component.enhance();
    fixture.detectChanges();
    await fixture.whenStable();

    const errEl = el.querySelector('[data-testid="error-message"]');
    expect(errEl).toBeTruthy();
  });

  it('error message is absent when there is no error', () => {
    expect(el.querySelector('[data-testid="error-message"]')).toBeFalsy();
  });

  // --- Logic tests ---

  it('creates successfully', () => {
    expect(component).toBeTruthy();
  });

  it('enhance() calls service and sets outputText', async () => {
    component.inputText = 'bad grammer';
    await component.enhance();
    expect(enhanceSpy).toHaveBeenCalledWith('bad grammer');
    expect(component.outputText).toBe('Enhanced output.');
    expect(component.loading).toBe(false);
  });

  it('enhance() does nothing when inputText is blank', async () => {
    component.inputText = '   ';
    await component.enhance();
    expect(enhanceSpy).not.toHaveBeenCalled();
  });

  it('enhance() sets error message on service failure', async () => {
    enhanceSpy.mockRejectedValue(new Error('API error'));
    component.inputText = 'some text';
    await component.enhance();
    expect(component.error).toBe('API error');
    expect(component.loading).toBe(false);
  });

  it('enhance() clears previous error before each call', async () => {
    component.error = 'old error';
    component.inputText = 'new text';
    await component.enhance();
    expect(component.error).toBe('');
  });

  it('shortcutTriggered$ reads clipboard and triggers enhance', async () => {
    wailsMock.readClipboard.mockResolvedValue('clipboard content');
    wailsMock._shortcutTriggered$.next('hotkey');
    await new Promise(r => setTimeout(r, 0));
    expect(wailsMock.readClipboard).toHaveBeenCalled();
    expect(component.inputText).toBe('clipboard content');
  });

  it('ngOnDestroy unsubscribes from shortcut events', async () => {
    component.ngOnDestroy();
    wailsMock._shortcutTriggered$.next('hotkey');
    await new Promise(r => setTimeout(r, 0));
    expect(wailsMock.readClipboard).not.toHaveBeenCalled();
  });
});
