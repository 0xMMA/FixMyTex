import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { WailsService } from './wails.service';

export const firstRunGuard: CanActivateFn = async () => {
  const wails = inject(WailsService);
  const router = inject(Router);
  try {
    const isFirst = await wails.isFirstRun();
    if (isFirst) {
      return router.createUrlTree(['/welcome']);
    }
  } catch {
    // Backend unavailable (e.g. browser dev mode) — allow through
  }
  return true;
};
