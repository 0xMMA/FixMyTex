import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-settings-container',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './settings-container.component.html',
  styleUrls: ['./settings-container.component.scss']
})
export class SettingsContainerComponent {
  navItems = [
    { path: 'general', label: 'General Settings' },
    { path: 'api', label: 'API Configuration' }
  ];
}