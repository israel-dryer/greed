const fs = require('fs');
const path = require('path');

// Get version bump type from args (patch, minor, major) - default to patch
const bumpType = process.argv[2] || 'patch';

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

// Parse and bump version
const [major, minor, patch] = package.version.split('.').map(Number);
let newVersion;

switch (bumpType) {
  case 'major':
    newVersion = `${major + 1}.0.0`;
    break;
  case 'minor':
    newVersion = `${major}.${minor + 1}.0`;
    break;
  case 'patch':
  default:
    newVersion = `${major}.${minor}.${patch + 1}`;
    break;
}

console.log(`Bumping version: ${package.version} -> ${newVersion}`);

// Update package.json
package.version = newVersion;
fs.writeFileSync(packagePath, JSON.stringify(package, null, 2) + '\n');
console.log('Updated package.json');

// Update main.ts
const mainPath = path.join(__dirname, '..', 'src', 'main.ts');
let mainContent = fs.readFileSync(mainPath, 'utf8');
mainContent = mainContent.replace(
  /\{provide: APP_VERSION, useValue: '[^']+'\}/,
  `{provide: APP_VERSION, useValue: '${newVersion}'}`
);
fs.writeFileSync(mainPath, mainContent);
console.log('Updated main.ts');

// Update manifest.webmanifest
const manifestPath = path.join(__dirname, '..', 'src', 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Updated manifest.webmanifest');

// Update service worker cache name with version
const swPath = path.join(__dirname, '..', 'src', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');
swContent = swContent.replace(
  /const CACHE_NAME = '[^']+'/,
  `const CACHE_NAME = 'greed-v${newVersion}'`
);
fs.writeFileSync(swPath, swContent);
console.log('Updated sw.js');

console.log(`\nVersion bumped to ${newVersion}`);
