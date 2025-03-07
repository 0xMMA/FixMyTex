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
- Set OPENAI_API_KEY environment variable to your OpenAI API key
- Target framework: .NET 9.0-windows with WPF

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

## Testing
- Unit tests use xUnit
- MockAiService.cs provides a mock implementation for testing
- Tests can use real API or mock service (configured in test class)