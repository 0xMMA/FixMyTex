import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { CommunicationAssistantComponent } from './communication-assistant.component';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
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