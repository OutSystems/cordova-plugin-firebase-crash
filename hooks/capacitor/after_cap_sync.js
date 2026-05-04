'use strict';

/**
 * Capacitor hook included with the plugin: runs after npx cap sync
 *
 * Adds the Crashlytics build phase to the Xcode project after `npx cap sync`,
 * mirroring what the Cordova `after_plugin_install` hook does for Cordova shells.
 * 
 * The hook will write a different path depending on the app being CocoaPods or SPM.
 *
 * Capacitor CLI sets CAPACITOR_PLATFORM_NAME to the platform being synced
 * and CAPACITOR_ROOT_DIR to the app's root directory.
 */

const path = require('path');
const fs = require('fs');
const xcode = require('../ios/xcode');

const BUILD_PHASE_COMMENT = 'Crashlytics';

async function main() {
    const platform = process.env.CAPACITOR_PLATFORM_NAME;

    if (platform && platform !== 'ios') {
        return;
    }

    const iosDir = path.resolve(process.env.CAPACITOR_ROOT_DIR, 'ios');
    const xcodeProjectPath = path.join(iosDir, 'App', 'App.xcodeproj', 'project.pbxproj');

    const xcodeProject = xcode.project(xcodeProjectPath);
    xcodeProject.parseSync();

    // Only add if not already there yet
    const buildPhase = xcodeProject.pbxItemByComment(BUILD_PHASE_COMMENT, 'PBXShellScriptBuildPhase');

    if (!buildPhase) {
        let shellScriptLocation = '"${PODS_ROOT}/FirebaseCrashlytics/run"';
        const capSPMPath = path.join(iosDir, 'App', 'CapApp-SPM');
        if (fs.existsSync(capSPMPath)) {
            // SPM apps have the firebase iOS SDK in a different location
            shellScriptLocation = '"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run"';
        }

        const result = xcodeProject.addBuildPhase([], 'PBXShellScriptBuildPhase', BUILD_PHASE_COMMENT, null, {
            shellPath: '/bin/sh',
            shellScript: shellScriptLocation,
            inputPaths: ['"$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)"'],
        });

        result.buildPhase.runOnlyForDeploymentPostprocessing = 1;

        fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync());

        console.log('\t[cordova-plugin-firebase-crash] [SUCCESS] Crashlytics build phase added to Xcode project.');
    } else {
        console.log('\t[cordova-plugin-firebase-crash] [SKIP] Crashlytics build phase already exists in Xcode project.');
    }
}

main().catch(function (err) {
    console.error('\t[cordova-plugin-firebase-crash] [ERROR] capacitor:sync:after hook failed:', err);
    process.exit(1);
});
