Write-Host "=== HELIO AI: App Build Script ==="

# 1. Setup Environment
$env:JAVA_HOME = "C:\Users\kasam\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot"
$env:ANDROID_HOME = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-sdk"
$gradleBin = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\gradle\gradle-8.7\bin"

$env:Path = "C:\Users\kasam\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot\bin;$gradleBin;" + $env:Path

# Check Java
if (-not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    Write-Error "Java not found at $env:JAVA_HOME"
    exit 1
}

# Check Android SDK
if (-not (Test-Path "$env:ANDROID_HOME\platforms\android-34")) {
    Write-Error "Android platform-34 not found in SDK"
    exit 1
}

# Check Gradle
$gradleCmd = "$gradleBin\gradle.bat"
if (-not (Test-Path $gradleCmd)) {
    Write-Error "Gradle command not found at $gradleCmd"
    exit 1
}

# 2. Run Gradle Build
Write-Host "Compiling Android App using local Gradle..."
$appDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-app"

Push-Location $appDir
try {
    & $gradleCmd clean assembleDebug
    Write-Host "Build finished successfully!"
} catch {
    Write-Error "Gradle build failed: $_"
    Pop-Location
    exit 1
}
Pop-Location

# 3. Copy APK to Releases
$apkSource = "$appDir\app\build\outputs\apk\debug\app-debug.apk"
$releasesDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\releases"

if (Test-Path $apkSource) {
    if (-not (Test-Path $releasesDir)) {
        New-Item -ItemType Directory -Path $releasesDir | Out-Null
    }
    Copy-Item -Path $apkSource -Destination "$releasesDir\helio-ai-v1.0-debug.apk" -Force
    Write-Host "=== Success! Compiled APK has been copied to: $releasesDir\helio-ai-v1.0-debug.apk ==="
} else {
    Write-Error "Could not find built APK at $apkSource"
    exit 1
}
