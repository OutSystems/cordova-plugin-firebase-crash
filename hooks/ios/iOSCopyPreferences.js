const path = require('path');
const fs = require('fs');
const plist = require('plist');
const { ConfigParser } = require('cordova-common');

module.exports = function (context) {
    let projectRoot = context.opts.cordova.project ? context.opts.cordova.project.root : context.opts.projectRoot;
    let configXML = path.join(projectRoot, 'config.xml');
    let configParser = new ConfigParser(configXML);

    let collectionEnabled = configParser.getGlobalPreference("FIREBASE_CRASHLYTICS_COLLECTION_ENABLED");
    if (!collectionEnabled || collectionEnabled.toLowerCase() !== 'false') {
        return;
    }

    // cordova-ios 8+ uses 'App' as the fixed project folder name and 'App-Info.plist'
    // cordova-ios <8 uses the app name as the project folder name
    let infoPlistPath = path.join(projectRoot, 'platforms/ios/App/App-Info.plist');
    if (!fs.existsSync(infoPlistPath)) {
        let appName = configParser.name();
        infoPlistPath = path.join(projectRoot, 'platforms/ios/' + appName + '/' + appName + '-info.plist');
    }

    let obj = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));
    obj['FirebaseCrashlyticsCollectionEnabled'] = false;
    fs.writeFileSync(infoPlistPath, plist.build(obj));
};