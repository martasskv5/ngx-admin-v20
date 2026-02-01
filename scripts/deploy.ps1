<#
.SYNOPSIS
    Deploys the portal Angular app to remote server with manifest-based change detection
.DESCRIPTION
    - Generates manifest of all files with SHA256 hashes
    - Compares with remote manifest to avoid unnecessary uploads
    - Only deploys if build has changed
    - Uses versioned directories with symlinks for easy rollback
    - Keeps last 20 versions for retention policy
#>

param(
    [string]$SSH_HOST = "ubuntu-server-24",
    [string]$DeployName = "ngx-admin-v20",
    [int]$RetentionCount = 5
)

$ErrorActionPreference = "Stop"

# Check for required tools
$plinkPath = (where.exe plink.exe 2>$null) | Select-Object -First 1
$pscpPath = (where.exe pscp.exe 2>$null) | Select-Object -First 1

if ([string]::IsNullOrEmpty($plinkPath)) {
    Write-Error "plink.exe not found in PATH. Please install PuTTY."
    exit 1
}

if ([string]::IsNullOrEmpty($pscpPath)) {
    Write-Error "pscp.exe not found in PATH. Please install PuTTY."
    exit 1
}

# Check if pageant is running
$pageantProcess = Get-Process -Name "pageant" -ErrorAction SilentlyContinue
if ($null -eq $pageantProcess) {
    Write-Host "⚠ Pageant is not running. Ensure keys are loaded in pageant before continuing."
    exit 1
}

# Get version from package.json
$packageJson = Get-Content -Path ".\package.json" | ConvertFrom-Json
$version = $packageJson.version
$buildTimestamp = Get-Date -Format "yyyyMMdd.HHmmss"
$buildMetadata = "$version-build.$buildTimestamp"

$remoteUser = $env:UserName
$remoteBuildBase = "/www/rezervacie-dashboard"
$remoteVersionPathTimestamped = "$remoteBuildBase/versions/$buildMetadata"
$remoteSymlinks = "$remoteBuildBase/symlinks"

Write-Host "Deploying $DeployName version: $buildMetadata"

# Generate manifest of build files
function New-BuildManifest {
    param([string]$DistPath)
    
    if (!(Test-Path $DistPath)) {
        throw "Distribution path not found: $DistPath"
    }
    
    $files = @(Get-ChildItem -Path $DistPath -Recurse -File)
    $manifest = @{}
    
    foreach ($file in $files) {
        $hash = (Get-FileHash -Path $file.FullName -Algorithm SHA256).Hash
        $relativePath = $file.FullName.Substring($DistPath.Length + 1).Replace('\', '/')
        $manifest[$relativePath] = $hash
    }
    
    return $manifest
}

# Get git commit for metadata
$gitCommit = (git rev-parse --short HEAD 2>$null) -or "unknown"

# Build local manifest
$distPath = ".\dist\browser"
$distPathAbsolute = Resolve-Path $distPath -ErrorAction Stop
Write-Host "Generating manifest from: $distPath"
Write-Host "Absolute path: $distPathAbsolute"
$localManifest = New-BuildManifest -DistPath $distPathAbsolute
$localManifestJson = $localManifest | ConvertTo-Json
$localManifestHash = (Get-FileHash -InputStream ([System.IO.MemoryStream]::new([System.Text.Encoding]::UTF8.GetBytes($localManifestJson))) -Algorithm SHA256).Hash

Write-Host "Local manifest hash: $localManifestHash"

# Check if remote has same build
Write-Host "Checking remote for existing builds..."
$remoteManifestPath = "$remoteBuildBase/latest/manifest.json"
$checkCmd = "test -f $remoteManifestPath && cat $remoteManifestPath || echo 'NOT_FOUND'"

$remoteManifestJson = & $plinkPath -batch "${remoteUser}@${SSH_HOST}" $checkCmd

Write-Host "Remote manifest: $remoteManifestJson"

if ($remoteManifestJson -ne "NOT_FOUND" -and $remoteManifestJson -eq $localManifestJson) {
    Write-Host "✓ Remote already has identical build - skipping deployment"
    exit 0
}

Write-Host "✓ Build differs from remote (or first deployment) - proceeding with deployment"

# Create version metadata
$versionMetadata = @{
    version = $version
    buildMetadata = $buildMetadata
    timestamp = (Get-Date -Format "o")
    gitCommit = $gitCommit
    buildPath = $remoteVersionPathTimestamped
    fileCount = $localManifest.Count
} | ConvertTo-Json

# Setup remote directory structure
Write-Host "Setting up remote directories..."
$setupCmd = "mkdir -p '$remoteVersionPathTimestamped' && mkdir -p '$remoteSymlinks' && mkdir -p '$remoteBuildBase/latest'"
& $plinkPath -batch "${remoteUser}@${SSH_HOST}" $setupCmd | Out-Null

# Copy all files to remote
Write-Host "Uploading build artifacts..."
$files = @(Get-ChildItem -Path $distPathAbsolute -Recurse -File)
$fileCount = 0
$totalFiles = $files.Count

if ($totalFiles -eq 0) {
    Write-Error "No files found in: $distPathAbsolute"
    Write-Host "Checking if path exists: $(Test-Path $distPathAbsolute)"
    exit 1
}

Write-Host "Total files to upload: $totalFiles"

foreach ($file in $files) {
    $fileCount++
    # Use absolute path for substring calculation
    $relativePath = $file.FullName.Substring($distPathAbsolute.Path.Length + 1).Replace('\', '/')
    $remotePath = "$remoteVersionPathTimestamped/$relativePath"
    
    # Copy file with full error reporting
    Write-Host "  [$fileCount/$totalFiles] Copying: $relativePath"
    $copyResult = & $pscpPath -p "$($file.FullName)" "${remoteUser}@${SSH_HOST}:${remotePath}" 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    ERROR: pscp failed with code $LASTEXITCODE"
        Write-Host "    Output: $copyResult"
    }
}

Write-Host ""
Write-Host "✓ Attempted to upload $totalFiles files"

# Save and copy metadata files
$manifestPath = ".\dist\$DeployName\browser\manifest.json"
$versionJsonPath = ".\dist\$DeployName\browser\version.json"

$localManifestJson | Out-File -FilePath $manifestPath -Encoding UTF8
$versionMetadata | Out-File -FilePath $versionJsonPath -Encoding UTF8

Write-Host "Uploading metadata..."
& $pscpPath -p $manifestPath "${remoteUser}@${SSH_HOST}:${remoteVersionPathTimestamped}/manifest.json" | Out-Null
& $pscpPath -p $versionJsonPath "${remoteUser}@${SSH_HOST}:${remoteVersionPathTimestamped}/version.json" | Out-Null

# Copy to latest folder for quick access
& $pscpPath -p $manifestPath "${remoteUser}@${SSH_HOST}:$remoteBuildBase/latest/manifest.json" | Out-Null
& $pscpPath -p $versionJsonPath "${remoteUser}@${SSH_HOST}:$remoteBuildBase/latest/version.json" | Out-Null

# Update symlinks
Write-Host "Updating symlinks..."
$symlinkCmd = "cd '$remoteSymlinks' && rm -f current latest && ln -s ../versions/$buildMetadata current && ln -s ../versions/$buildMetadata latest && rm -f stable && ln -s ../versions/$buildMetadata stable"
& $plinkPath -batch "${remoteUser}@${SSH_HOST}" $symlinkCmd | Out-Null

# Cleanup old versions
Write-Host "Cleaning up old versions (keeping last $RetentionCount)..."
$cleanupCmd = "cd '$remoteBuildBase/versions' && ls -t -d */ | tail -n +$($RetentionCount + 1) | xargs -r rm -rf"
& $plinkPath -batch "${remoteUser}@${SSH_HOST}" $cleanupCmd 2>$null

Write-Host ""
Write-Host "✓ Deployment complete!" -ForegroundColor Green
Write-Host "  Version: $version"
Write-Host "  Build: $buildMetadata"
Write-Host "  Files: $totalFiles"
Write-Host "  Remote: $remoteVersionPathTimestamped"