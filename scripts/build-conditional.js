const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get current git branch name
let branchName = '';
try {
  branchName = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
} catch (error) {
  console.error('Failed to get git branch name:', error.message);
  process.exit(1);
}

console.log(`Current branch: ${branchName}`);

// Determine output directory based on branch name
let outputDir = 'dist';
if (branchName.includes('rezervacie-admin')) {
  outputDir = 'dist/rezervacie-admin';
  console.log('Building for admin dashboard...');
} else if (branchName.includes('rezervacie-user')) {
  outputDir = 'dist/rezervacie-user';
  console.log('Building for user dashboard...');
} else {
  console.log('Building to default dist folder...');
}

// Read angular.json
const angularJsonPath = path.join(__dirname, 'angular.json');
const angularJson = JSON.parse(fs.readFileSync(angularJsonPath, 'utf-8'));

// Update output path
angularJson.projects['ngx-admin-demo'].architect.build.options.outputPath.base = outputDir;

// Write updated angular.json
fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2));

console.log(`Output directory set to: ${outputDir}`);

// Run the build
const buildCommand = process.argv.slice(2).join(' ') || 'ng build';
console.log(`Running: ${buildCommand}`);

try {
  execSync(buildCommand, { stdio: 'inherit' });
} catch (error) {
  process.exit(1);
}
