import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { firstRunGuard } from './first-run.guard';
import { WailsService } from './wails.service';
import { createWailsMock } from '../../testing/wails-mock';
import { provideRouter } from '@angular/router';

describe('firstRunGuard', () => {
  let wailsMock: ReturnType<typeof createWailsMock>;

  beforeEach(() => {
    wailsMock = createWailsMock();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: WailsService, useValue: wailsMock },
      ],
    });
  });

  it('returns true when not first run', async () => {
    wailsMock.isFirstRun.mockResolvedValue(false);
    const result = await TestBed.runInInjectionContext(
      () => firstRunGuard({} as never, {} as never),
    );
    expect(result).toBe(true);
  });

  it('redirects to /welcome when first run', async () => {
    wailsMock.isFirstRun.mockResolvedValue(true);
    const result = await TestBed.runInInjectionContext(
      () => firstRunGuard({} as never, {} as never),
    );
    expect(result).toBeInstanceOf(UrlTree);
    expect((result as UrlTree).toString()).toBe('/welcome');
  });
});
