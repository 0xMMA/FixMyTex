# FixMyTex Development Guide

## Build & Run Commands
```
dotnet build                    # Build the project
dotnet run                      # Run the application
dotnet test                     # Run unit tests
dotnet publish -c Release       # Create release build
dotnet publish -c Release -r win-x64 --self-contained -p:PublishSingleFile=true -o ./bin/Release/SelfContained/  # Create self-contained executable
```

## Environment Setup
- Set OPENAI_API_KEY environment variable for OpenAI API access
- Set ANTHROPIC_API_KEY environment variable for Claude API access
- Target framework: .NET 9.0-windows with WPF

## AI Service Providers
FixMyTex supports multiple AI service providers:
- OpenAI (GPT models)
- Claude (Anthropic models)
- SemanticKernel (Microsoft's framework supporting both OpenAI and Claude)

Default models:
- OpenAI: gpt-4o
- Claude: claude-3-5-haiku-latest

## Code Style Guidelines
- **Naming**: PascalCase for public members (classes, methods, properties), camelCase for private/internal
- **Formatting**: 4-space indentation, braces on same line as declaration
- **Types**: Enable nullable reference types, use init-only properties where appropriate
- **Error Handling**: Use try/catch blocks for external service calls, return informative error messages
- **Language Features**: Utilize modern C# features (collection expressions, raw string literals)
- **Async**: Use async/await pattern for all I/O operations, return Task<T> for async methods
- **Comments**: XML documentation for public classes/methods, inline comments for complex logic
- **Organization**: Group by functionality, public members first, private after

## Project Structure
- Source/ folder contains service classes and core functionality
  - IAiService.cs: Interface for AI service providers
  - OpenAiService.cs: Implementation for OpenAI
  - ClaudeService.cs: Implementation for Anthropic's Claude
  - SemanticKernelService.cs: Implementation using Microsoft's Semantic Kernel
  - AiServiceFactory.cs: Factory to create AI service instances
  - AppConfig.cs: Application configuration including the default prompt
  - ClipboardHelper.cs/ClipboardService.cs: Handle clipboard functionality
  - GlobalHotkeyService.cs: Manages global keyboard shortcuts
  - HotkeyConfig.cs: Configuration for keyboard shortcuts
- FixMyTex.Tests/ contains unit tests for the application
- MainWindow handles UI interactions

## Formatting Tags
The application uses specific tags to determine the formatting style:
- [HTML]: Uses HTML tags (e.g., <b>bold</b>, <i>italics</i>, <code>monospace</code>)
- [MARKDOWN]: Uses Markdown syntax (e.g., **bold**, _italics_, `monospace`)
- [PLAIN]: No formatting

The GlobalHotkeyService automatically adds these tags to the beginning of the text based on the source application:
- MS Teams/Outlook: Uses [HTML] formatting
- Other applications: Uses [MARKDOWN] formatting

## Hotkey Configuration
The application supports configurable hotkeys with the following properties:
- Caption: Display name for the hotkey action
- IconPath: Optional path to an icon for the action
- Enabled: Whether the hotkey is active
- Prompt: The AI system prompt to use for this action
- Shortcut: Key combination (e.g., "CTRL+G")
- ClipboardFormat: Format for clipboard operations ("HTML", "Text", or "AUTO")

## Planned Features

### Quick Actions
A modal UI providing quick access to common text transformations:
- Keyboard-navigable menu system appearing near text
- Hierarchical navigation with numbered shortcuts
- Categories including grammar fixes, tone changes, structural improvements, and more
- Support for audience context (boss, colleague, client) and communication goals

### Prompt Blocks
A modular system for constructing AI prompts from reusable components:
- Different block types (Identity, Task, Format, Rules, Examples, etc.)
- Self-contained, configurable blocks that work together
- Profile system for managing prompt templates
- Ordered assembly of blocks into complete prompts

### Smart Selection & OCR
Enhanced text selection capabilities:
- Screenshot capture integration
- OCR processing of selected screen areas
- Image annotation capabilities
- Integration with context for AI processing

## Testing
- Unit tests use xUnit
- MockAiService.cs provides a mock implementation for testing
- Tests can use real API or mock service (configured in test class)