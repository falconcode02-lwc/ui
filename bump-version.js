const fs = require('fs');
const path = require('path');

// Read package.json
const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

let [major, minor, patch] = pkg.version.split('.').map(Number);

// Increment minor version
minor += 1;
const newVersion = `${major}.${minor}.${patch}`;
pkg.version = newVersion;

// Write back to package.json
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
console.log(`✅ Version bumped to ${newVersion}`);

// Create src/environments/version.ts
const envFile = path.join(__dirname, 'src', 'app', 'environments', 'version.ts');
const content = `// This file is auto-generated at build time
export const APP_VERSION = '${newVersion}';
export const BUILD_TIME = '${new Date().toISOString()}';
`;

fs.writeFileSync(envFile, content);
console.log(`📝 version.ts updated with version ${newVersion}`);
