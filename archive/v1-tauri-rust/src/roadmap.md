# FixMyTex Migration Roadmap: WPF to Tauri Angular

## Overview
This document outlines the plan for migrating FixMyTex from its original WPF implementation to a new Tauri Angular architecture. The migration will focus on preserving core functionality while modernizing the codebase and improving user experience.

## Core Principles
- **Spirit over Syntax**: Migrate features conceptually rather than line-by-line
- **Simplify**: Streamline complex features and remove unfinished concepts
- **Focus**: Prioritize the communication assistant with pyramidal structuring feature
- **Modern Stack**: Leverage JavaScript-based LangChain for AI integration

## Current Status
The new Tauri Angular application has the following components in place:
- Basic application structure with Tauri backend and Angular frontend
- System tray integration
- Global shortcut registration framework
- Window management

## UI Architecture Reference
The complete UI structure is defined in `../docs/feature pyramidal structuring UI Layout.md` which includes:
- Communication Assistant (main working interface)
- General Configuration (system settings and shortcuts)
- API Configuration (provider and key management)
- System tray integration

## Feature Migration Plan

### Phase 1: Core Infrastructure & Settings 

#### 1.1 LangChain JS Integration
- Implement LangChain JS as replacement for LangChain.NET
- Create provider abstraction layer for multiple AI services (OpenAI, Claude)
- Set up API key management via settings UI (not environment variables)
- Implement basic text processing functionality

#### 1.2 Settings Pages Implementation
Based on the YAML specification:
- **General Config Page**: Autostart toggle, shortcut configuration (Silent Fix, UI Assistant)
- **API Config Page**: Provider selection, model selection, secure API key input
- Implement persistent storage for all settings
- Create navigation between settings pages

#### 1.3 System Tray & Window Management
- Implement system tray with Open/Settings/Quit menu
- "Open" launches Communication Assistant mode
- "Settings" opens settings window with page navigation

### Phase 2: Communication Assistant Core 

#### 2.1 Main UI Implementation
Based on the YAML layout specification:
- **Left Panel**: Settings controls (checkboxes, dropdowns for communication style/relationship level)
- **Right Panel**: Text display with Draft/Original/History tabs + Action buttons grid
- Implement the branching history tree visualization
- Create the iterative action button system

#### 2.2 Text Processing Pipeline
- Implement the core transformation actions: Concise, Detail/Expand, Persuasive, Neutral, Diplomatic, Direct, Casual, Professional
- Add pyramidal structuring as a checkbox option
- Implement translation functionality with language dropdown
- Create the communication style and relationship level context system

#### 2.3 History & State Management
- Implement branching history tree for multiple transformation paths
- Add fork visualization when user tries different actions from same point
- Create undo/redo functionality via history navigation
- Implement session persistence

### Phase 3: AI Integration & Advanced Features 

#### 3.1 Multi-Stage Processing Pipeline
- Implement Analysis Chain for language detection and content extraction
- Create Structure Chain for pyramidal hierarchy creation
- Develop context-aware prompts based on communication style + relationship level
- Add smart retry mechanisms with failure analysis

#### 3.2 Advanced UI Features
- Implement real-time preview of transformations
- Add keyboard shortcuts for all action buttons
- Create drag-and-drop file support mentioned in original design
- Implement the "Type follow up Task" functionality

#### 3.3 Prompt Block Foundation
- Create basic prompt block system to support the communication style/relationship level combinations
- Implement parameter substitution for dynamic prompts
- Design for future extensibility (referenced in roadmap for later phases)

### Phase 4: Polish & Future Features (Future Phases)

#### 4.1 Performance Optimization
- Implement result caching for quick switching between transformations
- Add streaming results for long operations
- Optimize history storage and retrieval

#### 4.2 Extended Features (Lower Priority)
- Quick Actions modal (keyboard-driven menu from original design)
- Smart Selection with OCR (future enhancement)
- Profile management for saving custom configurations
- Import/export functionality

## Technical Implementation Details

### Frontend (Angular)
- **Component Structure** (maps to YAML layout):
  - App shell with system tray integration
  - Communication Assistant (split horizontal layout)
  - Settings pages (single column layouts)
  - Shared components for dropdowns, buttons, history tree
- **State Management**:
  - Angular services for settings, history, and text processing
  - RxJS for reactive patterns and history management

### Backend (Tauri/Rust)
- **Core Services**:
  - Clipboard integration for text capture/replacement
  - Global shortcuts (Ctrl+G configurable)
  - System tray management (Open/Settings/Quit)
  - Secure storage for API keys

### AI Integration (LangChain JS)
- **Context-Aware Processing**:
  - Dynamic prompt generation based on communication_style + relationship_level
  - Provider management with fallback mechanisms
  - Chain architecture for multi-stage processing (pyramidal structuring)

## Migration Considerations

### Updated from Original Design
- Settings moved from environment variables to dedicated UI pages
- Quick Actions simplified to action button grid in main interface
- History system redesigned as branching tree with fork visualization
- Communication context system (style + relationship) replaces simple audience targeting

### Removed/Simplified Features
- Complex radial menu system → simple button grid
- Environment variable dependency → settings UI
- Overly complex prompt blocks → context-aware prompt generation

## Success Metrics
- Successful implementation of the Communication Assistant UI as specified
- Working pyramidal structuring with context awareness
- Intuitive settings management across three pages
- Performance equal to or better than WPF version
- Clean separation between UI components and business logic

## Next Steps
1. Clean up the angular project default app.htm 
2. Implement the settings pages per YAML specification
3. Create the Communication Assistant layout (left settings, right text+actions)
4. Set up LangChain JS with provider switching
5. Begin basic text transformation pipeline
6. Implement branching history system