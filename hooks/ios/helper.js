const path = require("path");
const fs = require("fs");

module.exports = {
    BUILD_PHASE_COMMENT: "Crashlytics",

    isCordovaIos8OrHigher: function() {
        const apiPath = path.resolve("platforms", "ios", "cordova", "Api.js");
        if (!fs.existsSync(apiPath)) {
            return false;
        }
        const version = require(apiPath).version();
        return parseInt(version.split(".")[0], 10) >= 8;
    },

    getXcodeProjectPath: function(context) {
        // cordova-ios 8+ uses 'App.xcodeproj' as the fixed project name
        // cordova-ios <8 uses the app name as the project name
        const cordovaIos8Path = path.join("platforms", "ios", "App.xcodeproj", "project.pbxproj");
        if (fs.existsSync(cordovaIos8Path)) {
            return cordovaIos8Path;
        }
        const ConfigParser = context.requireCordovaModule("cordova-lib").configparser;
        const appName = new ConfigParser("config.xml").name();
        return path.join("platforms", "ios", appName + ".xcodeproj", "project.pbxproj");
    }
};