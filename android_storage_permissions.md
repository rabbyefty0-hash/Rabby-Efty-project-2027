# Android Storage Permissions & Visibility Logic

## AndroidManifest.xml

To request full storage access, especially for Android 11+ (API level 30+), you need the `MANAGE_EXTERNAL_STORAGE` permission. For older versions, `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` are required.

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.your.package.name">

    <!-- For Android 10 and below -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />

    <!-- For Android 11 and above (Manage External Storage) -->
    <uses-permission android:name="android.permission.MANAGE_EXTERNAL_STORAGE" />
    
    <!-- Required to query other apps for visibility logic (Android 11+) -->
    <queries>
        <package android:name="com.google.android.youtube" />
    </queries>

    <application
        android:requestLegacyExternalStorage="true"
        ... >
        ...
    </application>
</manifest>
```

## Kotlin Implementation

Here is the Kotlin code to request these permissions at runtime.

### PermissionHelper.kt

```kotlin
import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

class PermissionHelper(private val activity: AppCompatActivity) {

    private lateinit var storagePermissionLauncher: ActivityResultLauncher<Intent>
    private lateinit var requestPermissionLauncher: ActivityResultLauncher<Array<String>>

    fun registerLaunchers(onPermissionResult: (Boolean) -> Unit) {
        // For Android 11+ MANAGE_EXTERNAL_STORAGE
        storagePermissionLauncher = activity.registerForActivityResult(
            ActivityResultContracts.StartActivityForResult()
        ) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                onPermissionResult(Environment.isExternalStorageManager())
            }
        }

        // For Android 10 and below
        requestPermissionLauncher = activity.registerForActivityResult(
            ActivityResultContracts.RequestMultiplePermissions()
        ) { permissions ->
            val readGranted = permissions[Manifest.permission.READ_EXTERNAL_STORAGE] ?: false
            val writeGranted = permissions[Manifest.permission.WRITE_EXTERNAL_STORAGE] ?: false
            onPermissionResult(readGranted && writeGranted)
        }
    }

    fun hasStoragePermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            Environment.isExternalStorageManager()
        } else {
            val read = ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE)
            val write = ContextCompat.checkSelfPermission(activity, Manifest.permission.WRITE_EXTERNAL_STORAGE)
            read == PackageManager.PERMISSION_GRANTED && write == PackageManager.PERMISSION_GRANTED
        }
    }

    fun requestStoragePermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            try {
                val intent = Intent(Settings.ACTION_MANAGE_APP_ALL_FILES_ACCESS_PERMISSION)
                intent.addCategory("android.intent.category.DEFAULT")
                intent.data = Uri.parse(String.format("package:%s", activity.packageName))
                storagePermissionLauncher.launch(intent)
            } catch (e: Exception) {
                val intent = Intent()
                intent.action = Settings.ACTION_MANAGE_ALL_FILES_ACCESS_PERMISSION
                storagePermissionLauncher.launch(intent)
            }
        } else {
            requestPermissionLauncher.launch(
                arrayOf(
                    Manifest.permission.READ_EXTERNAL_STORAGE,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE
                )
            )
        }
    }
    
    // Logic to check if YouTube is installed and hide it from custom UI if needed
    fun isYouTubeInstalled(): Boolean {
        val pm: PackageManager = activity.packageManager
        return try {
            pm.getPackageInfo("com.google.android.youtube", PackageManager.GET_ACTIVITIES)
            true
        } catch (e: PackageManager.NameNotFoundException) {
            false
        }
    }
}
```

### MainActivity.kt

```kotlin
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    private lateinit var permissionHelper: PermissionHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        permissionHelper = PermissionHelper(this)
        permissionHelper.registerLaunchers { isGranted ->
            if (isGranted) {
                Toast.makeText(this, "Storage Permission Granted", Toast.LENGTH_SHORT).show()
                // Proceed to load Gallery, Music, Files
            } else {
                Toast.makeText(this, "Storage Permission Denied", Toast.LENGTH_SHORT).show()
            }
        }

        if (!permissionHelper.hasStoragePermission()) {
            permissionHelper.requestStoragePermission()
        } else {
            // Proceed to load Gallery, Music, Files
        }
        
        // App Visibility Logic
        if (permissionHelper.isYouTubeInstalled()) {
            // Logic to hide YouTube from your custom launcher or interface
            // e.g., appsList.removeAll { it.packageName == "com.google.android.youtube" }
        }
    }
}
```

## XML Layout (activity_main.xml)

```xml
<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <TextView
        android:id="@+id/statusText"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Checking Permissions..."
        android:textSize="18sp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent" />

</androidx.constraintlayout.widget.ConstraintLayout>
```

## Gemini Live Voice Optimization Notes

For Android, to optimize Gemini Live Voice (or any real-time audio streaming):
1. **AudioRecord Configuration**: Use `MediaRecorder.AudioSource.VOICE_COMMUNICATION` instead of `MIC`. This enables hardware echo cancellation and noise suppression.
2. **Buffer Size**: Use a smaller buffer size (e.g., `AudioRecord.getMinBufferSize` or a fixed small chunk like 2048 bytes) to reduce latency.
3. **Sample Rate**: Use 16000Hz (16kHz) as it is the standard for speech recognition and provides a good balance between quality and bandwidth.
4. **Playback**: Use `AudioTrack` in `MODE_STREAM` with a low latency configuration for smooth audio output.

```kotlin
// Example AudioRecord setup for low latency voice
val sampleRate = 16000
val channelConfig = AudioFormat.CHANNEL_IN_MONO
val audioFormat = AudioFormat.ENCODING_PCM_16BIT
val minBufSize = AudioRecord.getMinBufferSize(sampleRate, channelConfig, audioFormat)

val audioRecord = AudioRecord(
    MediaRecorder.AudioSource.VOICE_COMMUNICATION, // Enables AEC and NS
    sampleRate,
    channelConfig,
    audioFormat,
    minBufSize
)
```
