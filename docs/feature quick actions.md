# Feature: Quick Actions

## Goal
Provide quick access to common text transformation actions and feedback mechanisms with a flexible, configurable system.

## Requirements

### 1. User Interface
- Display a modal window in the center of the focused application
- Show the initial AI suggestion prominently when configured
- Present multiple quick action options in a grid/panel layout
- Support keyboard navigation for quick selection
- Allow dismissal with Escape key or clicking outside
- Clean, minimal design consistent with main application
- Provide undo functionality to revert to original text
- Show preview of action results when possible

### 2. Prompt Building System
- Modular prompt architecture with swappable components
- Support for different prompt block types:
  - Identity blocks (who the AI is)
  - Task blocks (what the AI should do)
  - Context blocks (background information)
  - Format blocks (output formatting rules)
  - Constraint blocks (limitations)
  - Rules blocks (specific instructions)
  - Examples blocks (demonstrations)
  - Tone blocks (formal, casual, technical)
  - Style blocks (concise, detailed, persuasive)
  - Translation blocks (language conversion)
- Simple block ordering based on priority
- Parameter substitution capability
- Predefined templates for common actions

### 3. Configuration
- Create and manage multiple quick action profiles
- Export/import profiles for sharing
- Set application-specific defaults
- Configure hotkeys for specific quick actions
- Customize UI appearance
- Save frequently used configurations

### 4. Workflow Integration
- Maintain select-text → hotkey workflow
- Option to show quick action UI immediately after hotkey
- Alternative workflow: preview text first, then show options
- Allow reprocessing of already-processed text
- Feedback mechanism for suggestions
- Error handling for API failures or timeout conditions
- Basic history of recent actions

### 5. Performance Considerations
- Cache processed results to allow quick switching between options
- Simple history management for current session
- Background processing when appropriate
- Future support for streaming results as they arrive

## Implementation Plan

### Phase 1: Core Block Library
1. Implement base interfaces and simplified block base class
   - Core block interface with ordering priority
   - Basic parameter handling
   - Simple content generation
   - Block registry for storing available blocks

2. Create blocks for current prompt
   - Implement all blocks needed to recreate existing functionality
   - Build simple assembly engine with ordering support
   - Create default profile matching current behavior

### Phase 2: Quick Actions UI
1. Design and implement Quick Actions window
   - Main layout with suggestion display
   - Action buttons grid
   - Keyboard navigation
   - Window positioning logic
   - Undo functionality
   - Basic error handling

2. Integrate with existing hotkey system
   - Modify GlobalHotkeyService
   - Add configuration options
   - Implement focused application detection
   - Basic result caching

### Phase 3: User Experience Enhancements
1. Implement advanced UI features
   - Action preview capability
   - Feedback collection mechanism
   - Error recovery options
   - Visual feedback improvements

2. Add profile management
   - Profile storage implementation
   - Import/export functionality
   - Profile management UI
   - Predefined templates for common actions

### Phase 4: Refinement & Extended Features
1. Add visual polish and UX improvements
   - Animations and transitions
   - Visual feedback mechanisms
   - Accessibility enhancements
   - Progressive disclosure of advanced features

2. Add advanced customization features
   - User-defined action templates
   - Advanced configuration UI
   - Performance optimizations
   - Additional specialized blocks

## Technical Design

### Prompt Block System
```
IPromptBlock (interface)
 ├── PromptBlockBase (abstract)
 ├── IdentityBlock
 ├── TaskBlock
 ├── ContextBlock 
 ├── FormatBlock
 ├── ConstraintBlock
 ├── RulesBlock
 ├── ExamplesBlock
 ├── ToneBlock
 ├── StyleBlock
 └── TranslationBlock

PromptProfile
 ├── Name
 ├── Description
 ├── BlockIds
 └── BlockParameters
```

### UI Component Structure
```
QuickActionWindow
 ├── SuggestionPanel
 │    ├── OriginalTextDisplay
 │    └── SuggestedTextDisplay
 ├── ActionButtonsPanel
 │    └── [Collection of ActionButtons]
 ├── FeedbackPanel
 └── UndoManager
```

## Testing Strategy
1. **Unit Testing**
   - Test each block type in isolation
   - Verify parameter handling
   - Test simple block combinations

2. **Integration Testing**
   - End-to-end workflow tests
   - Cross-application clipboard handling
   - Test with sample profiles

3. **User Scenario Testing**
   - Key user flows with defined success criteria
   - Error state and recovery testing
   - Accessibility compliance testing
   - Multi-monitor configuration testing

## Next Steps
1. Implement IPromptBlock interface and base class
2. Create blocks that match our current prompt
3. Build simple prompt assembly engine
4. Create prototype UI mockups
5. Define test plan for basic functionality