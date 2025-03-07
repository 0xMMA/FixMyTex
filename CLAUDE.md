# FixMyTex Development Guide

## Build & Run Commands
```
dotnet build                  # Build the project
dotnet run                    # Run the application
dotnet publish -c Release     # Create release build
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
- MainWindow handles UI interactions
- Use .NET's built-in dependency injection where needed