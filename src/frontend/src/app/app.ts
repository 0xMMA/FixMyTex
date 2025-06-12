import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { register } from '@tauri-apps/plugin-global-shortcut';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected title = 'frontend';

  async ngOnInit() {
    await this.registerGlobalShortcuts();
  }

  private async registerGlobalShortcuts() {
    try {
      await register('CommandOrControl+G', () => {
        alert('Hello World');
      });
      console.log('Global shortcut Ctrl+G registered successfully');
    } catch (error) {
      console.error('Failed to register global shortcut:', error);
    }
  }
}
