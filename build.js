const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Create dist directory if it doesn't exist
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}

// Build executables
console.log('Building executables...');
execSync('npm run build:all', { stdio: 'inherit' });

// Create zip files for distribution
console.log('Creating distribution packages...');

// Mac Intel
if (fs.existsSync('dist/osc-t2s-mac-intel')) {
  execSync('cd dist && zip -r osc-t2s-mac-intel.zip osc-t2s-mac-intel', { stdio: 'inherit' });
  console.log('Created osc-t2s-mac-intel.zip');
}

// Mac ARM
if (fs.existsSync('dist/osc-t2s-mac-arm')) {
  execSync('cd dist && zip -r osc-t2s-mac-arm.zip osc-t2s-mac-arm', { stdio: 'inherit' });
  console.log('Created osc-t2s-mac-arm.zip');
}

// Windows
if (fs.existsSync('dist/osc-t2s-windows.exe')) {
  execSync('cd dist && zip -r osc-t2s-windows.zip osc-t2s-windows.exe', { stdio: 'inherit' });
  console.log('Created osc-t2s-windows.zip');
}

console.log('Build complete! Distribution packages are in the dist directory.'); 