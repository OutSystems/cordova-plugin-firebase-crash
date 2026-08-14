
# Build Actions

This folder contains a .yaml file for configuring build actions to use in a plugin on ODC with Capacitor. The purpose of these build actions is to provide the same functionality as cordova hooks, but on a Capacitor shell.

## Contents

The file [updateCrashlyticsConfig.yaml](./updateCrashlyticsConfig.yaml) contains the following build actions:

1. Android specific. Adds the `firebase_performance_collection_enabled` meta-data entry - according to the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` parameter - to the app's `AndroidManifest.xml`. With it you can enable/disable crashlytics in the Android app.
2. iOS specific. Set `FirebaseCrashlyticsCollectionEnabled` - according to the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` parameter - in the app's Info.plist file. With it you can enable/disable crashlytics in the iOS app.
3. Android specific. Injects the Crashlytics Gradle plugin classpath (`com.google.firebase:firebase-crashlytics-gradle`) into the app's root `build.gradle`, and applies the Crashlytics Gradle plugin directly in the app's `app/build.gradle`. This is done here rather than in this plugin's own `src/android/build.gradle` because that file is `apply from:`'d into an isolated script-plugin classloader, and applying the Crashlytics Gradle plugin from that isolated context breaks under AGP 9/Gradle 9 (classloader mismatch on `ApplicationAndroidComponentsExtension`, even though the application plugin is genuinely applied). Declaring it directly in the app's own Gradle files instead keeps it in the same classloader as the app's own AGP, avoiding the problem entirely. The Cordova-side equivalent of this fix is the [`hooks/android/addCrashlyticsGradlePlugin.js`](../hooks/android/addCrashlyticsGradlePlugin.js) hook.

Note: Some specific changes cannot be done via Build Actions. Refer to [capacitor hooks folder](../hooks/capacitor/) for more information.

## Outsystems' Usage

1. Copy the build action yaml file (which can contain multiple build actions inside) into the ODC Plugin, placing them in "Data" -> "Resources" and set "Deploy Action" to "Deploy to Target Directory", with target directory empty.
2. Update the Plugin's Extensibility configuration to use the build action.

```json
{
    "buildConfigurations": {
        "buildAction": {
            "config": $resources.buildActionFileName.yaml,
            "parameters": {
                // parameters go here; if there are no parameters then the block can be ommited
            }
        }
    }
}
```