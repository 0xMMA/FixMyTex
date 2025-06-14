import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../shared/material.module';
import { CommunicationAssistantComponent } from './communication-assistant.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MaterialModule,
    CommunicationAssistantComponent,
    RouterModule.forChild([
      {
        path: 'assistant',
        component: CommunicationAssistantComponent
      }
    ])
  ]
})
export class CommunicationAssistantModule { }
