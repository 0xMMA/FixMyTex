# FixMyTex Migration Roadmap: WPF to Tauri Angular

## Overview
This document outlines the plan for migrating FixMyTex from its original WPF implementation to a new Tauri Angular architecture. The migration will focus on preserving core functionality while modernizing the codebase and improving user experience.

## Core Principles
- **Spirit over Syntax**: Migrate features conceptually rather than line-by-line
- **Simplify**: Streamline complex features and remove unfinished concepts
- **Focus**: Prioritize the pyramidal structuring feature as the main initial focus
- **Modern Stack**: Leverage JavaScript-based LangChain for AI integration

## Current Status
The new Tauri Angular application has the following components in place:
- Basic application structure with Tauri backend and Angular frontend
- System tray integration
- Global shortcut registration framework
- Window management

## Feature Migration Plan

### Phase 1: Core Infrastructure (1-2 Sprints)

#### 1.1 LangChain JS Integration
- Implement LangChain JS as a replacement for LangChain.NET
- Create provider abstraction layer for multiple AI services
- Set up API key management from environment variables
- Implement basic text processing functionality

#### 1.2 Settings UI
- Create settings page with the following sections:
  - API Keys configuration (OpenAI, Claude, etc.)
  - Shortcut configuration
  - General application settings
- Implement persistent storage for settings

#### 1.3 Basic Text Processing
- Implement clipboard service for text capture and replacement
- Add format detection (HTML, Markdown, Plain text)
- Create simple prompt template system

### Phase 2: Pyramidal Structuring Feature (2-3 Sprints)

#### 2.1 Multi-Stage Processing Pipeline
- Implement Analysis Chain for language detection and content extraction
- Create Structure Chain for hierarchy creation and organization
- Develop Subject Chain for template-based formatting
- Add Validation Chain for quality checking

#### 2.2 UI for Pyramidal Structuring
- Design and implement UI for pyramidal structuring configuration
- Create visualization for the processing stages
- Add options for customizing the pyramidal structure

#### 2.3 Smart Retry with Agents
- Implement failure analysis and adaptive retry strategies
- Create context-aware prompts for retry
- Add learning loop for successful patterns

### Phase 3: Advanced Features (Future Phases)

#### 3.1 Quick Actions (Lower Priority)
- Design simplified version of the Quick Actions UI
- Implement core action functionality
- Create framework for extensible actions

#### 3.2 Prompt Blocks (Future Enhancement)
- Design modular prompt architecture
- Implement basic block types
- Create UI for managing prompt blocks

#### 3.3 Smart Selection (Future Enhancement)
- Research OCR integration options
- Design UI for area selection
- Implement basic functionality

## Technical Implementation Details

### Frontend (Angular)
- **Component Structure**:
  - Main application shell
  - Settings panel
  - Pyramidal structuring UI
  - Notification components
- **State Management**:
  - Use Angular services for state management
  - Implement reactive patterns with RxJS

### Backend (Tauri/Rust)
- **Core Services**:
  - Clipboard integration
  - Global shortcuts
  - System tray management
  - Window management

### AI Integration (LangChain JS)
- **Provider Management**:
  - Support for OpenAI, Claude, and other providers
  - Automatic provider selection based on task
  - Fallback mechanisms
- **Chain Architecture**:
  - Sequential processing chains
  - Conditional routing
  - Error handling and retry logic

## Migration Considerations

### Simplified Features
- The styling with `code` in prompts will be toned down as mentioned in the requirements
- Quick Actions will be simplified and implemented in a later phase
- Unfinished concepts will be removed or redesigned

### Environment Variables to Settings UI
- Move from environment variables to a settings UI for API keys
- Implement secure storage for sensitive information

### Shortcuts
- Maintain the Ctrl+G shortcut for text enhancement
- Add configurability for all shortcuts

## Success Metrics
- Successful implementation of the pyramidal structuring feature
- Improved user experience for settings and configuration
- Maintainable codebase with clear separation of concerns
- Performance comparable to or better than the WPF version

## Next Steps
1. Set up LangChain JS integration
2. Implement settings UI for API keys and shortcuts
3. Begin development of the pyramidal structuring feature
4. Create basic text processing functionality