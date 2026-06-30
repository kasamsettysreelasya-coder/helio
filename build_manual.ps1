Write-Host "=== HELIO AI: Manual Compilation Pipeline (No-Gradle) ==="

$env:JAVA_HOME = "C:\Users\kasam\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot"
$env:Path = "C:\Users\kasam\AppData\Local\Programs\Microsoft\jdk-17.0.10.7-hotspot\bin;" + $env:Path

$sdkDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-sdk"
$buildToolsDir = "$sdkDir\build-tools\34.0.0"
$platformJar = "$sdkDir\platforms\android-34\android.jar"

# 1. Clean and create build folders
$buildDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\manual_build"
if (Test-Path $buildDir) {
    Write-Host "Cleaning previous build..."
    Remove-Item -Path $buildDir -Recurse -Force
}
New-Item -ItemType Directory -Path $buildDir | Out-Null
New-Item -ItemType Directory -Path "$buildDir\obj" | Out-Null
New-Item -ItemType Directory -Path "$buildDir\dex" | Out-Null

$appDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-app\app"

# Remove any pre-existing generated R.java to prevent overlaps
$preExistingR = "$appDir\src\main\java\com\helio\app\R.java"
if (Test-Path $preExistingR) {
    Remove-Item -Path $preExistingR -Force
}

# 2. Compile resource files with AAPT2
Write-Host "Compiling resource files with AAPT2..."
& "$buildToolsDir\aapt2.exe" compile --dir "$appDir\src\main\res" -o "$buildDir\compiled_res.zip"

if (-not (Test-Path "$buildDir\compiled_res.zip")) {
    Write-Error "AAPT2 resource compilation failed."
    exit 1
}

# 3. Link compiled resources to generate R.java and the base APK package
Write-Host "Linking resources and generating R.java..."
& "$buildToolsDir\aapt2.exe" link --manifest "$appDir\src\main\AndroidManifest.xml" -I $platformJar -o "$buildDir\app-unaligned.apk" "$buildDir\compiled_res.zip" --java "$appDir\src\main\java"

$rJava = "$appDir\src\main\java\com\helio\app\R.java"
if (-not (Test-Path $rJava)) {
    Write-Error "R.java was not generated. Link step failed."
    exit 1
}
Write-Host "R.java generated successfully at $rJava"

# 4. Compile Java files
Write-Host "Compiling Java files with javac..."
$javaSources = Get-ChildItem -Path "$appDir\src\main\java\com\helio\app\*.java" | ForEach-Object { $_.FullName }
& javac.exe -d "$buildDir\obj" -classpath $platformJar -source 8 -target 8 $javaSources

# Check if compilation succeeded
if (-not (Test-Path "$buildDir\obj\com\helio\app\MainActivity.class")) {
    Write-Error "Java compilation failed."
    exit 1
}
Write-Host "Java files compiled successfully."

# 5. Convert class files to Dex bytecode
Write-Host "Translating Java bytecode to Dex..."
$classFiles = Get-ChildItem -Path "$buildDir\obj\com\helio\app\*.class" | ForEach-Object { $_.FullName }
& "$buildToolsDir\d8.bat" --lib $platformJar --output "$buildDir\dex" $classFiles

$classesDex = "$buildDir\dex\classes.dex"
if (-not (Test-Path $classesDex)) {
    Write-Error "Dex translation failed. classes.dex not generated."
    exit 1
}
Write-Host "Dex file generated successfully."

# 6. Add classes.dex to the base APK package
Write-Host "Injecting classes.dex into APK..."
Push-Location "$buildDir\dex"
& jar.exe uf "$buildDir\app-unaligned.apk" classes.dex
Pop-Location

# 7. Zipalign the package
Write-Host "Aligning APK..."
& "$buildToolsDir\zipalign.exe" -v -f 4 "$buildDir\app-unaligned.apk" "$buildDir\app-aligned.apk"

# 8. Sign the APK with a debug keystore
Write-Host "Signing APK..."
$keystore = "$buildDir\debug.keystore"
# Generate self-signed key
& keytool.exe -genkeypair -v -keystore $keystore -keyalg RSA -keysize 2048 -validity 10000 -alias androiddebugkey -storepass android -keypass android -dname "CN=Android Debug, O=Android, C=US"

$signedApk = "$buildDir\helio-ai-v1.0-debug.apk"
cmd.exe /c "`"$buildToolsDir\apksigner.bat`" sign --ks `"$keystore`" --ks-pass pass:android --key-pass pass:android --out `"$signedApk`" `"$buildDir\app-aligned.apk`""

if (Test-Path $signedApk) {
    # 9. Copy to Releases folder
    $releasesDir = "c:\Users\kasam\OneDrive\Desktop\hackthon_3\releases"
    if (-not (Test-Path $releasesDir)) {
        New-Item -ItemType Directory -Path $releasesDir | Out-Null
    }
    Copy-Item -Path $signedApk -Destination "$releasesDir\helio-ai-v1.0-debug.apk" -Force
    Write-Host "=== MANUAL BUILD SUCCESSFUL! APK generated at: $releasesDir\helio-ai-v1.0-debug.apk ==="
} else {
    Write-Error "Signing failed."
    exit 1
}
