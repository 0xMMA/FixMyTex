# FixMyTex ![icon](./src/backend/src-tauri/icons/icons8-mutig-ai-32.png) [![Build and Test](https://github.com/0xMMA/FixMyTex/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/0xMMA/FixMyTex/actions/workflows/build-and-test.yml) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/0xMMA/FixMyTex)](https://github.com/0xMMA/FixMyTex/releases) [![GitHub all releases](https://img.shields.io/github/downloads/0xMMA/FixMyTex/total)](https://github.com/0xMMA/FixMyTex/releases) [![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/0xMMA/FixMyTex?include_prereleases&label=pre-release)](https://github.com/0xMMA/FixMyTex/releases)

A desktop application that enhances your writing with AI-powered grammar, style, and text improvements - just a keyboard shortcut away.

## Features

- **Instant Text Enhancement**: Press Ctrl+G to improve any selected text
- **LangChain Integration**: Flexible AI abstraction layer for advanced text processing
- **Multiple AI Providers**: Supports OpenAI, Claude, (untested: Azure OpenAI, HuggingFace, and Google Gemini)
- **Context-Aware Formatting**: Automatically detects source application and applies appropriate formatting (HTML, Markdown, or Plain text)
- **Global Hotkeys**: Works across all applications with customizable keyboard shortcuts
- **Minimal UI**: Runs in the background with minimal interruption to your workflow
- **Automatic Updates**: Check for and install updates directly from the application

## Getting Started

### Prerequisites
- Windows operating system
- API key for at least one of the supported AI services (Anthropic, OpenAI)

### Installation

1. Download the latest release from the [Releases](https://github.com/0xMMA/FixMyTex/releases) page
   - Or build from source (see [Build Instructions](#build-instructions))
2. Launch the application 
3. Configure API keys, models and providers

### Usage

1. Select text in any application
2. Press `Ctrl+G` 
3. Wait a moment for the AI to process
4. Your text will be replaced with the improved version

## Build Instructions

```bash
# Clone the repository
git clone https://github.com/0xMMA/FixMyTex.git
cd FixMyTex

# Install frontend dependencies
cd src/frontend
npm install

# Install backend dependencies
cd ../backend
npm install

# Run in development mode
npm run tauri:dev

# Build for production
npm run tauri:build
```

The build output will be located in `src/backend/src-tauri/target/release`.

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Build and Test**: Automatically builds and tests the application on every push and PR
- **CodeQL Analysis**: Performs code quality and security analysis
- **Release Workflow**: Creates draft releases with Windows binaries when version tags are pushed

> **Note:** Update the repository URL in the README badges after forking this repository

To create a new release:
1. Push a tag with the format `v*` (e.g., `v1.0.0`)
2. The release workflow will create a draft release with Windows binaries
3. Review and publish the release

## Roadmap

- [ ] [Pyramidal Structuring](docs/feature%20pyradmidal%20structuring.md) (LangChain-powered advanced processing)
- [ ] [Quick Actions](docs/feature%20quick%20actions.md) (Radial Menu) -> **Prompt** (change tone, change style)
  - [ ] [Smart Selection](docs/feature%20smart%20selection.md) (screenshots, OCR rectangles + add/remove area)
- [ ] [Prompt Blocks](docs/prompt%20blocks.md) - modular prompt architecture
- [X] Interactive UI for configuration changes
- [X] In-app API key management (instead of environment variables)
- [X] Multiple AI model support and customization
- [ ] Quick chat functionality
- [X] Self-update capability
- [X] Installer package

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- App Logo from [icons8.com](https://icons8.com)
- Built with Tauri, Angular, Material, and LangChain
