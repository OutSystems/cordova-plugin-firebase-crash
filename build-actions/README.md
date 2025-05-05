
# Build Actions

This folder contains a .yaml file for configuring build actions to use in a plugin on ODC with Capacitor. The purpose of these build actions is to provide the same functionality as cordova hooks, but on a Capacitor shell.

## Contents

The file [updateCrashlyticsConfig.yaml](./updateCrashlyticsConfig.yaml) contains four build actions:

1. Android specific. Adds the `firebase_performance_collection_enabled` meta-data entry - according to the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` parameter - to the app's `AndroidManifest.xml`. With it you can enable/disable crashlytics in the Android app.
2. Android specific. Apply the Firebase Android Gradle Plugin in the application's `build.gradle` file. Required because plugins Android code is added as separate library modules in Capacitor - and you cannot apply Crashlytics AGP to a library module.
3. iOS specific. Set `FirebaseCrashlyticsCollectionEnabled` - according to the `FIREBASE_CRASHLYTICS_COLLECTION_ENABLED` parameter - in the app's Info.plist file. With it you can enable/disable crashlytics in the iOS app.
4. iOS specific. Adds a build phase for XCode to upload files to Firebase, to help with getting more readable crash reports.


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