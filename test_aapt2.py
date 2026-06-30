import subprocess
import os

manifest_content = """<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.helio.app">
    <application>
        <activity android:name="com.helio.app.MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
"""

with open('test_manifest.xml', 'w', encoding='utf-8') as f:
    f.write(manifest_content)

aapt2_path = r"c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-sdk\build-tools\34.0.0\aapt2.exe"
platform_jar = r"c:\Users\kasam\OneDrive\Desktop\hackthon_3\android-sdk\platforms\android-34\android.jar"

cmd = [
    aapt2_path,
    'link',
    '--manifest', 'test_manifest.xml',
    '-I', platform_jar,
    '-o', 'test_out.apk'
]

print("Running command:", " ".join(cmd))
res = subprocess.run(cmd, capture_output=True, text=True)
print('Exit Code:', res.returncode)
print('STDOUT:', res.stdout)
print('STDERR:', res.stderr)
