$ProgressPreference = 'SilentlyContinue'

$sdkDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-sdk"
$tempDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\temp_sdk"

Write-Host "=== HELIO AI: Android SDK Setup Script ==="

# 1. Create directories
if (-not (Test-Path $sdkDir)) {
    Write-Host "Creating Android SDK directory at: $sdkDir"
    New-Item -ItemType Directory -Path $sdkDir | Out-Null
}
if (-not (Test-Path $tempDir)) {
    Write-Host "Creating temp download directory at: $tempDir"
    New-Item -ItemType Directory -Path $tempDir | Out-Null
}

$zipPath = "$tempDir\cmdline-tools.zip"
$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

# 2. Download ZIP
if (-not (Test-Path $zipPath)) {
    Write-Host "Downloading Android SDK Command-line Tools (approx. 120MB)..."
    try {
        Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $zipPath
        Write-Host "Download complete!"
    } catch {
        Write-Error "Failed to download Android SDK Command-line tools: $_"
        exit 1
    }
} else {
    Write-Host "Command-line Tools ZIP already downloaded."
}

# 3. Extract ZIP
$extractedPath = "$tempDir\extracted"
if (-not (Test-Path $extractedPath)) {
    Write-Host "Extracting Android SDK Command-line Tools..."
    try {
        Expand-Archive -Path $zipPath -DestinationPath $extractedPath -Force
        Write-Host "Extraction complete!"
    } catch {
        Write-Error "Failed to extract ZIP file: $_"
        exit 1
    }
} else {
    Write-Host "Command-line Tools already extracted."
}

# 4. Move files to standard structure: <sdk_root>/cmdline-tools/latest
$destCmdlineTools = "$sdkDir\cmdline-tools\latest"
if (-not (Test-Path $destCmdlineTools)) {
    Write-Host "Moving tools to standard directory structure: $destCmdlineTools..."
    try {
        $parentDir = New-Item -ItemType Directory -Path "$sdkDir\cmdline-tools" -ErrorAction SilentlyContinue | Out-Null
        $latestDir = New-Item -ItemType Directory -Path $destCmdlineTools -Force
        Move-Item -Path "$extractedPath\cmdline-tools\*" -Destination $destCmdlineTools -Force
        Write-Host "Move complete!"
    } catch {
        Write-Error "Failed to structure cmdline-tools: $_"
        exit 1
    }
} else {
    Write-Host "Command-line Tools already structured."
}

# 5. Accept licenses
Write-Host "Accepting Android SDK licenses..."
$sdkManager = "$destCmdlineTools\bin\sdkmanager.bat"
if (-not (Test-Path $sdkManager)) {
    Write-Error "Could not find sdkmanager.bat at $sdkManager"
    exit 1
}

# Use cmd to pipe 'y' to sdkmanager licenses
try {
    cmd.exe /c "echo y| `"$sdkManager`" --sdk_root=`"$sdkDir`" --licenses"
    Write-Host "Licenses accepted successfully!"
} catch {
    Write-Error "Failed to accept licenses: $_"
    exit 1
}

# 6. Install platforms and build tools
Write-Host "Installing Platform-tools, Platforms;android-34, and Build-tools;34.0.0..."
try {
    & $sdkManager --sdk_root=$sdkDir "platform-tools" "platforms;android-34" "build-tools;34.0.0"
    Write-Host "Android SDK dependencies installed successfully!"
} catch {
    Write-Error "Failed to install Android SDK components: $_"
    exit 1
}

Write-Host "=== Android SDK Setup Completed Successfully! ==="
