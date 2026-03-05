import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load project-root .env so E2E tests can use ANTHROPIC_API_KEY etc.
dotenv.config({ path: path.join(__dirname, '../.env') });

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
    screenshot: 'on',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:4200',
    timeout: 60_000,
    reuseExistingServer: true,
    // Inject NG_APP_* vars so Angular's esbuild builder exposes them via import.meta.env
    env: {
      NG_APP_ANTHROPIC_API_KEY: process.env['ANTHROPIC_API_KEY'] ?? '',
    },
  },
});
