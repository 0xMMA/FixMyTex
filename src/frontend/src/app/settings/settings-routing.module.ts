import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SettingsContainerComponent } from './settings-container/settings-container.component';
import { GeneralConfigComponent } from './general-config/general-config.component';
import { ApiConfigComponent } from './api-config/api-config.component';

const routes: Routes = [
  {
    path: 'settings',
    component: SettingsContainerComponent,
    children: [
      {
        path: '',
        redirectTo: 'general',
        pathMatch: 'full'
      },
      {
        path: 'general',
        component: GeneralConfigComponent
      },
      {
        path: 'api',
        component: ApiConfigComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SettingsRoutingModule { }
