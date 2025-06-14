import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../shared/material.module';

@Component({
  selector: 'app-communication-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './communication-assistant.component.html',
  styleUrls: ['./communication-assistant.component.scss']
})
export class CommunicationAssistantComponent {
  // Settings panel properties
  communicationStyles = [
    { id: 'concise', name: 'Concise' },
    { id: 'detailed', name: 'Detailed' },
    { id: 'persuasive', name: 'Persuasive' },
    { id: 'neutral', name: 'Neutral' },
    { id: 'diplomatic', name: 'Diplomatic' },
    { id: 'direct', name: 'Direct' },
    { id: 'casual', name: 'Casual' },
    { id: 'professional', name: 'Professional' }
  ];

  relationshipLevels = [
    { id: 'formal', name: 'Formal' },
    { id: 'professional', name: 'Professional' },
    { id: 'casual', name: 'Casual' },
    { id: 'friendly', name: 'Friendly' }
  ];

  selectedStyle = 'professional';
  selectedRelationship = 'professional';
  enablePyramidalStructuring = true;

  // Text panel properties
  originalText = '';
  draftText = '';
  activeTab = 'draft'; // 'draft', 'original'

  // Methods for handling user interactions
  onStyleChange(): void {
    console.log('Communication style changed to:', this.selectedStyle);
    // In a real implementation, this would trigger text processing
  }

  onRelationshipChange(): void {
    console.log('Relationship level changed to:', this.selectedRelationship);
    // In a real implementation, this would trigger text processing
  }

  onPyramidalStructuringChange(): void {
    console.log('Pyramidal structuring toggled:', this.enablePyramidalStructuring);
    // In a real implementation, this would trigger text processing
  }

  onTabChange(tabIndex: number | string): void {
    if (typeof tabIndex === 'number') {
      this.activeTab = tabIndex === 0 ? 'draft' : 'original';
    } else {
      this.activeTab = tabIndex;
    }
  }

  onTextChange(): void {
    console.log('Text changed');
    // In a real implementation, this would update the text state
  }

  processText(action: string): void {
    console.log('Processing text with action:', action);
    // In a real implementation, this would call the AI service to process the text
  }
}
