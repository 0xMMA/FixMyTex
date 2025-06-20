import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../shared/material.module';
import { MessageBusService } from '../services/message-bus.service';
import { UIAssistedActionData, UIAssistedActionHandler } from '../handlers/ui-assisted-action-handler';
import { PyramidalAgentService, PyramidalAgentResult, DocumentType } from '../services/pyramidal-agent.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-communication-assistant',
  standalone: true,
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './communication-assistant.component.html',
  styleUrls: ['./communication-assistant.component.scss']
})
export class CommunicationAssistantComponent implements OnInit, OnDestroy {
  private textReadySubscription: Subscription | null = null;
  sourceApp: string = '';
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

  documentTypeOptions = [
    { id: DocumentType.AUTO, name: 'Auto-detect' },
    { id: DocumentType.EMAIL, name: 'Email' },
    { id: DocumentType.WIKI, name: 'Wiki' },
    { id: DocumentType.POWERPOINT, name: 'PowerPoint' },
    { id: DocumentType.MEMO, name: 'Memo' }
  ];

  selectedStyle = 'professional';
  selectedRelationship = 'professional';
  selectedDocumentType = DocumentType.AUTO;
  enablePyramidalStructuring = true;

  // Text panel properties
  originalText = '';
  draftText = '';
  instructionsText = ''; // New property for instructions input
  activeTab = 'original'; // 'draft', 'original'

  // Pyramidal agent properties
  processingResult: PyramidalAgentResult | null = null;
  isProcessing = false;

  constructor(
    private messageBus: MessageBusService,
    private uiAssistedActionHandler: UIAssistedActionHandler,
    private pyramidalAgentService: PyramidalAgentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to the ui-assisted:text-ready event
    this.textReadySubscription = this.messageBus.on<UIAssistedActionData>('ui-assisted:text-ready')
      .subscribe(data => {
        console.log('Received text-ready event with data:', data);
        this.originalText = data.text;
        this.sourceApp = data.sourceApp;
        // Switch to the original tab to show the text
        this.activeTab = 'original';
        // Manually trigger change detection to update the UI
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    // Clean up subscription when the component is destroyed
    if (this.textReadySubscription) {
      this.textReadySubscription.unsubscribe();
      this.textReadySubscription = null;
    }
  }

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

  onDocumentTypeChange(): void {
    console.log('Document type changed to:', this.selectedDocumentType);
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

  onInstructionsChange(): void {
    console.log('Instructions changed:', this.instructionsText);
    // In a real implementation, this would update the instruction state
  }

  /**
   * Process text using the pyramidal agent flow
   * @param action The action to perform (not used in pyramidal flow)
   */
  async processText(action: string): Promise<void> {
    console.log('Processing text with action:', action);

    if (!this.originalText) {
      console.warn('No text to process');
      return;
    }

    try {
      this.isProcessing = true;

      // Process the text using the pyramidal agent flow
      this.processingResult = await this.pyramidalAgentService.processDocument(
        this.originalText,
        this.selectedDocumentType,
        this.sourceApp,
        this.instructionsText,
      );

      console.log('Pyramidal agent processing result:', this.processingResult);

      // Update the draft text with the final email
      this.draftText = this.processingResult.finalDocument;

      // Switch to the draft tab to show the result
      this.activeTab = 'draft';
    } catch (error) {
      console.error('Error processing text with pyramidal agent flow:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Send the processed text back to the source application
   * @param text The text to send back (defaults to the draft text)
   */
  sendBackToSourceApp(text: string = this.draftText): void {
    if (!this.sourceApp) {
      console.warn('No source application to send text back to');
      return;
    }

    if (!text) {
      console.warn('No text to send back');
      return;
    }

    console.log('Sending text back to source application:', this.sourceApp);
    this.uiAssistedActionHandler.pasteBackToSourceApp(text)
      .then(() => {
        console.log('Text successfully sent back to source application');
      })
      .catch(error => {
        console.error('Error sending text back to source application:', error);
      });
  }

  protected readonly Math = Math;
  protected readonly window = window;
}
