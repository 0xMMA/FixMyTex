import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { isDevMode } from '@angular/core';
import { Subscription } from 'rxjs';
import { WailsService } from '../core/wails.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styleUrls: ['./shell.component.scss'],
  template: `
    <div class="layout-wrapper">
      <aside class="layout-sidebar">
        <div class="layout-logo">
          <span class="logo-text"><span class="logo-key">Key</span><span class="logo-lint">Lint</span></span>
        </div>
        <nav class="sidebar-nav">
          <ul>
            <li class="nav-item">
              <a routerLink="/fix" routerLinkActive="active-route">
                <i class="pi pi-sparkles"></i>
                <span>Fix</span>
              </a>
            </li>
            <li class="nav-item">
              <a routerLink="/enhance" routerLinkActive="active-route">
                <svg class="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" width="1rem" height="1rem">
                  <polygon points="12,3 22,21 2,21"/>
                </svg>
                <span>Pyramidize</span>
              </a>
            </li>
            <li class="nav-item">
              <a routerLink="/settings" routerLinkActive="active-route">
                <i class="pi pi-cog"></i>
                <span>Settings</span>
              </a>
            </li>
            @if (dev) {
              <li class="nav-item">
                <a routerLink="/dev-tools" routerLinkActive="active-route">
                  <i class="pi pi-wrench"></i>
                  <span>Dev Tools</span>
                </a>
              </li>
            }
          </ul>
        </nav>
        <div class="sidebar-footer" data-testid="version-footer" (click)="goToAbout()">
          <span class="version-text">v{{ appVersion || '…' }}</span>
          @if (updateAvailable) {
            <i class="pi pi-arrow-circle-up update-indicator" data-testid="update-indicator" title="Update available"></i>
          }
        </div>
      </aside>
      <div class="layout-main">
        <router-outlet />
      </div>
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  readonly dev = isDevMode();
  appVersion = '';
  updateAvailable = false;
  private sub?: Subscription;

  constructor(
    private readonly wails: WailsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    void this.applyTheme();
    void this.loadVersionInfo();
    this.sub = this.wails.settingsChanged$.subscribe(() => void this.applyTheme());
  }

  goToAbout(): void {
    void this.router.navigate(['/settings'], { queryParams: { tab: 'about' } });
  }

  private async loadVersionInfo(): Promise<void> {
    this.appVersion = await this.wails.getVersion();
    this.cdr.detectChanges();
    try {
      const info = await this.wails.checkForUpdate();
      this.updateAvailable = info.is_available;
    } catch {
      // Silently ignore — update check is best-effort.
    }
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private async applyTheme(): Promise<void> {
    const settings = await this.wails.loadSettings();
    // Dark-first app: only explicit 'light' disables dark mode.
    // 'dark', 'system', or anything else → keep dark mode.
    const dark = settings.theme_preference !== 'light';
    document.body.classList.toggle('app-dark', dark);
  }
}
