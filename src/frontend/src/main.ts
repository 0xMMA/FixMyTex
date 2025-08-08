import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { attachConsole } from '@tauri-apps/plugin-log';

async function main() {
  await attachConsole();
  await bootstrapApplication(App, appConfig);
}

main().catch((err: any) => console.error(err));
