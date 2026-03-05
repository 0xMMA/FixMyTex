# Testing

## Frontend (Vitest)

Runner: `@angular/build:unit-test` with `runner: vitest` (configured in `angular.json`). No zone.js.

**Key constraints:**
- Use `async/await`, NOT `fakeAsync`/`tick` (no zone.js)
- `vi.mock()` is blocked by the Angular Vitest runner — use Angular DI mocking instead
- For timer-dependent tests use `vi.useFakeTimers()` / `vi.runAllTimersAsync()`

**Mock pattern:** `createWailsMock()` in `frontend/src/testing/wails-mock.ts` returns a fully-stubbed `WailsService` with `vi.fn()` spies. Inject via `{ provide: WailsService, useValue: wailsMock }` in `TestBed`.

**NG0100 (ExpressionChangedAfterChecked):** call `fixture.detectChanges()` twice, or pre-set async state before the first `detectChanges()`.

**`@switch` navigation tests:** click the real inner `<button>` element (PrimeNG wraps `p-button`), not the `p-button` host. Directly mutating `component.step` won't trigger Angular change detection the same way.

**PrimeFlex / TabList in jsdom:** TabList uses `ResizeObserver` which doesn't exist in jsdom. Mock it at the top of any spec that imports tab components:
```typescript
(globalThis as any)['ResizeObserver'] = class { observe() {} unobserve() {} disconnect() {} };
```

**DOM-first testing principle:** assert on what the user sees, not internal TypeScript state. Use `data-testid` attributes. Example: `el.querySelector('[data-testid="fix-output"]')?.value`.

**Async component init:** after `fixture.detectChanges()`, always `await fixture.whenStable()` before querying DOM for async-loaded content.

## Backend (Go)

Run: `go test ./internal/...`

Settings tests use `XDG_CONFIG_HOME` env override to redirect file I/O to a temp dir — see `internal/features/settings/service_test.go`.

## E2E (Playwright)

Run: `cd frontend && npx playwright test`

- Config: `frontend/playwright.config.ts` — auto-starts `ng serve` on port 4200
- Loads `.env` via dotenv; passes `NG_APP_ANTHROPIC_API_KEY` to webServer process
- Anthropic API is CORS-blocked in browsers; use `page.route('https://api.anthropic.com/**', handler)` proxy pattern
- API key injection for browser mode: `page.evaluate(k => localStorage.setItem('_e2e_apikey_claude', k), apiKey)`
- Screenshots saved to `frontend/e2e/screenshots/`
- `silent-fix.spec.ts` is wrapped in `test.describe.skip` (verified working, kept for reference)
