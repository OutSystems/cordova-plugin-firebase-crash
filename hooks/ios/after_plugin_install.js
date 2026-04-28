const fs = require("fs");
const xcode = require("./xcode");
const helper = require("./helper");

module.exports = function(context) {
    const comment = helper.BUILD_PHASE_COMMENT;
    const xcodeProjectPath = helper.getXcodeProjectPath(context);
    const xcodeProject = xcode.project(xcodeProjectPath);

    xcodeProject.parseSync();

    // Only add if not already there yet

    const buildPhase = xcodeProject.pbxItemByComment(comment, "PBXShellScriptBuildPhase");

    if (!buildPhase) {
        const cordovaIosVersion = context.requireCordovaModule("cordova-ios/package").version;
        const cordovaIosMajor = parseInt(cordovaIosVersion.split(".")[0], 10);
        const supportsSPM = cordovaIosMajor >= 8;

        const shellScript = supportsSPM
            ? "\"${BUILD_DIR%/Build/*}/SourcePackages/checkouts/firebase-ios-sdk/Crashlytics/run\""
            : "\"${PODS_ROOT}/FirebaseCrashlytics/run\"";

        const result = xcodeProject.addBuildPhase([], "PBXShellScriptBuildPhase", comment, null, {
            shellPath: "/bin/sh",
            shellScript: shellScript,
            inputPaths: ["\"$(BUILT_PRODUCTS_DIR)/$(INFOPLIST_PATH)\""]
        });

        result.buildPhase.runOnlyForDeploymentPostprocessing = 1;

        fs.writeFileSync(xcodeProjectPath, xcodeProject.writeSync());
    }
};
