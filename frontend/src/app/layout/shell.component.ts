import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { isDevMode } from '@angular/core';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="layout-wrapper layout-static">
      <aside class="layout-sidebar">
        <div class="sidebar-header">
          <span class="app-title">FixMyTex</span>
        </div>
        <nav class="sidebar-menu">
          <ul>
            <li>
              <a routerLink="/enhance" routerLinkActive="active-route">
                <i class="pi pi-pencil"></i>
                <span>Enhance</span>
              </a>
            </li>
            <li>
              <a routerLink="/settings" routerLinkActive="active-route">
                <i class="pi pi-cog"></i>
                <span>Settings</span>
              </a>
            </li>
            @if (dev) {
              <li>
                <a routerLink="/dev-tools" routerLinkActive="active-route">
                  <i class="pi pi-wrench"></i>
                  <span>Dev Tools</span>
                </a>
              </li>
            }
          </ul>
        </nav>
      </aside>
      <div class="layout-main">
        <router-outlet />
      </div>
    </div>
  `,
  styles: [`
    .layout-wrapper {
      display: flex;
      height: 100vh;
    }
    .layout-sidebar {
      width: 250px;
      background: var(--p-surface-900, #18181b);
      border-right: 1px solid var(--p-surface-700, #3f3f46);
      display: flex;
      flex-direction: column;
    }
    .sidebar-header {
      padding: 1.5rem 1rem;
      border-bottom: 1px solid var(--p-surface-700, #3f3f46);
    }
    .app-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--p-primary-color, #f97316);
    }
    .sidebar-menu ul {
      list-style: none;
      padding: 0.5rem 0;
      margin: 0;
    }
    .sidebar-menu a {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      color: var(--p-surface-200, #e4e4e7);
      text-decoration: none;
      border-radius: 6px;
      margin: 2px 0.5rem;
      transition: background 0.15s;
    }
    .sidebar-menu a:hover,
    .sidebar-menu a.active-route {
      background: var(--p-primary-color, #f97316);
      color: #fff;
    }
    .layout-main {
      flex: 1;
      overflow: auto;
      background: var(--p-surface-950, #09090b);
    }
  `],
})
export class ShellComponent {
  readonly dev = isDevMode();
}
