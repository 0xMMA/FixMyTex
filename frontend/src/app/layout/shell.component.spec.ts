import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ShellComponent } from './shell.component';
import { WailsService } from '../core/wails.service';
import { createWailsMock, defaultSettings } from '../../testing/wails-mock';

describe('ShellComponent — theme / body class', () => {
  let wailsMock: ReturnType<typeof createWailsMock>;

  beforeEach(async () => {
    document.body.classList.remove('app-dark');

    wailsMock = createWailsMock();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: WailsService, useValue: wailsMock },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    document.body.classList.remove('app-dark');
  });

  async function createAndWait(theme_preference: string): Promise<ComponentFixture<ShellComponent>> {
    wailsMock.loadSettings.mockResolvedValue({ ...defaultSettings, theme_preference: theme_preference as never });
    const fixture = TestBed.createComponent(ShellComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  it('adds app-dark to body for dark theme', async () => {
    await createAndWait('dark');
    expect(document.body.classList.contains('app-dark')).toBe(true);
  });

  it('removes app-dark from body for light theme', async () => {
    document.body.classList.add('app-dark');
    await createAndWait('light');
    expect(document.body.classList.contains('app-dark')).toBe(false);
  });

  it('keeps app-dark for system theme (dark-first app)', async () => {
    await createAndWait('system');
    expect(document.body.classList.contains('app-dark')).toBe(true);
  });

  it('re-applies theme when settingsChanged$ emits', async () => {
    const fixture = await createAndWait('dark');
    expect(document.body.classList.contains('app-dark')).toBe(true);

    wailsMock.loadSettings.mockResolvedValue({ ...defaultSettings, theme_preference: 'light' });
    wailsMock._settingsChanged$.next();
    await fixture.whenStable();

    expect(document.body.classList.contains('app-dark')).toBe(false);
  });

  it('renders the sidebar nav', async () => {
    const fixture = await createAndWait('dark');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.layout-sidebar')).toBeTruthy();
    expect(el.querySelector('nav.sidebar-nav')).toBeTruthy();
  });
});
