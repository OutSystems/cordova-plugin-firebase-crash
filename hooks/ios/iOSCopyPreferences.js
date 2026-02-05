const path = require('path');
const fs = require('fs');
const plist = require('plist');
const { ConfigParser } = require('cordova-common');

module.exports = function (context) {
    let projectRoot = context.opts.cordova.project ? context.opts.cordova.project.root : context.opts.projectRoot;
    let configXML = path.join(projectRoot, 'config.xml');
    let configParser = new ConfigParser(configXML);
    
    let appName = configParser.name();
    let infoPlistPath = path.join(projectRoot, 'platforms/ios/' + appName + '/'+ appName +'-info.plist');
    let obj = plist.parse(fs.readFileSync(infoPlistPath, 'utf8'));

    let collectionEnabled = configParser.getGlobalPreference("FIREBASE_CRASHLYTICS_COLLECTION_ENABLED");
    if (collectionEnabled.toLowerCase() == 'false') {
        obj['FirebaseCrashlyticsCollectionEnabled'] = false;
    }

    fs.writeFileSync(infoPlistPath, plist.build(obj));
};