import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsContainerComponent } from './settings-container/settings-container.component';
import { GeneralConfigComponent } from './general-config/general-config.component';
import { ApiConfigComponent } from './api-config/api-config.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    SettingsRoutingModule,
    SettingsContainerComponent,
    GeneralConfigComponent,
    ApiConfigComponent
  ]
})
export class SettingsModule { }
