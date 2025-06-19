const fs = require('fs');
const path = require('path');

// Read the version from version.json
const versionFile = path.join(__dirname, 'version.json');
const versionData = JSON.parse(fs.readFileSync(versionFile, 'utf8'));
const version = versionData.version;

console.log(`Updating all version references to ${version}`);

// Update frontend package.json
const frontendPackageFile = path.join(__dirname, 'src', 'frontend', 'package.json');
const frontendPackage = JSON.parse(fs.readFileSync(frontendPackageFile, 'utf8'));
frontendPackage.version = version;
fs.writeFileSync(frontendPackageFile, JSON.stringify(frontendPackage, null, 2) + '\n');
console.log(`Updated frontend package.json to version ${version}`);

// Update backend package.json
const backendPackageFile = path.join(__dirname, 'src', 'backend', 'package.json');
const backendPackage = JSON.parse(fs.readFileSync(backendPackageFile, 'utf8'));
backendPackage.version = version;
fs.writeFileSync(backendPackageFile, JSON.stringify(backendPackage, null, 2) + '\n');
console.log(`Updated backend package.json to version ${version}`);

// Update Tauri configuration
const tauriConfigFile = path.join(__dirname, 'src', 'backend', 'src-tauri', 'tauri.conf.json');
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigFile, 'utf8'));
tauriConfig.version = version;
fs.writeFileSync(tauriConfigFile, JSON.stringify(tauriConfig, null, 2) + '\n');
console.log(`Updated tauri.conf.json to version ${version}`);

console.log('All version references updated successfully!');
