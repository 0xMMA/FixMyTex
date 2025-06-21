# FixMyTex ![icon](./src/backend/src-tauri/icons/icons8-mutig-ai-32.png) [![Build and Test](https://github.com/0xMMA/FixMyTex/actions/workflows/build-and-test.yml/badge.svg)](https://github.com/0xMMA/FixMyTex/actions/workflows/build-and-test.yml) [![GitHub release (latest by date)](https://img.shields.io/github/v/release/0xMMA/FixMyTex)](https://github.com/0xMMA/FixMyTex/releases) [![GitHub all releases](https://img.shields.io/github/downloads/0xMMA/FixMyTex/total)](https://github.com/0xMMA/FixMyTex/releases) [![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/0xMMA/FixMyTex?include_prereleases&label=pre-release)](https://github.com/0xMMA/FixMyTex/releases)

A desktop application that enhances your writing with AI-powered grammar, style, and text improvements - just a keyboard shortcut away.

Perfect for professional emails, chat messages, documents, and social media posts. No more copy-pasting between tools - FixMyTex provides instant AI text enhancement wherever you're typing. Select text, press `Ctrl+G` for instant improvements, or press twice for the advanced UI assistant.

## 🚀 Features

| Feature                        | Description                                                          |
| ------------------------------ | -------------------------------------------------------------------- |
| ⚡ **Instant Enhancement**     | Press `Ctrl+G` to instantly improve selected text.                   |
| 📧 **Email Assistant**         | Press `Ctrl+G` twice for professional email quality.                 |
| 🤖 **Multiple AI Providers**   | Supports OpenAI, Claude, Ollama, AWS Bedrock; Azure OpenAI *(soon)*. |
| 🌍 **Global Hotkeys**          | Customizable shortcuts work in all apps.                             |
| 🎯 **Minimal UI**              | Runs quietly in the background, no workflow disruption.              |
| 🔽 **System Tray Integration** | Option to start minimized in system tray.                            |
| 🔄 **Auto-Updates**            | Checks and installs updates automatically.                           |
| 🔒 **Secure API Storage**      | Stores API keys securely using System Credential Manager.            |

---



## Getting Started

### Prerequisites
- Windows operating system
- API key for at least one of the supported AI services (Anthropic, OpenAI, AWS Bedrock), or an Ollama installation

### Installation

1. Download the latest release from the [Releases](https://github.com/0xMMA/FixMyTex/releases) page
   - Or build from source (see [Build Instructions](#build-instructions))
2. Launch the application 
3. Configure API keys, models and providers

### Usage - Instant Silent Enhancement
1. Select text in any application
2. Press `Ctrl+G` 
3. Wait a moment for the AI to process
4. Your text will be replaced with the improved version

### Usage - Instant Professional Emails 
1. Select text in any application (Outlook or your preferred Mail Tool)
2. Press `Ctrl+G` (twice)
3. UI Asstiant opens
4. Select `Mail | Auto-Detect | Wiki | Memo | Powerpoint`
5. Click `Process with Pyramidal Agent`
3. Wait a moment for the AI to process
4. Your text will be refactored as a draft

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

### Versioning

This project uses a centralized versioning system with a single source of truth:

1. The `version.json` file in the root directory contains the current version number
2. The `update-version.js` script automatically updates all version references in the project
3. NPM scripts are provided for easy version management:

```bash
# Update all version references from version.json
npm run update-version

# Increment patch version (e.g., 2.0.0 -> 2.0.1)
npm run version:patch

# Increment minor version (e.g., 2.0.0 -> 2.1.0)
npm run version:minor

# Increment major version (e.g., 2.0.0 -> 3.0.0)
npm run version:major

# Build with automatic version synchronization
npm run build
```

When creating a new release, simply run one of the version increment commands and then build:

```bash
npm run version:patch  # or version:minor or version:major
npm run build
```

This ensures that all version references in the project (frontend, backend, and Tauri configuration) are synchronized automatically.

### CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- **Build and Test**: Automatically builds and tests the application on every push and PR
- **CodeQL Analysis**: Performs code quality and security analysis
- **Release Workflow**: Creates draft releases with Windows binaries when version tags are pushed

> **Note:** Update the repository URL in the README badges after forking this repository

To create a new release:
1. Update the version using one of the version commands:
   ```bash
   npm run version:patch  # or version:minor or version:major
   ```
2. Commit the changes to version.json and other updated files
3. Push a tag with the format `v*` matching the new version (e.g., `v2.0.1`)
   ```bash
   git tag v2.0.1
   git push origin v2.0.1
   ```
4. The release workflow will create a draft release with Windows binaries
5. Review and publish the release

## Roadmap

- [X] [Pyramidal Structuring](docs/feature%20pyradmidal%20structuring.md) (LangChain-powered advanced processing)
  - [X] Enhanced pyramidal agent with improved analysis accuracy
  - [X] Desired type preset for better text formatting
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
