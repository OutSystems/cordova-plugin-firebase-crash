const path = require('path');
const fs = require('fs');

const CRASHLYTICS_CLASSPATH = "com.google.firebase:firebase-crashlytics-gradle:3.0.7";
const CRASHLYTICS_MARKER = 'firebase-crashlytics-gradle';
const APPLY_MARKER = 'com.google.firebase.crashlytics.buildtools.gradle.CrashlyticsPlugin';

function insertClasspath(rootBuildGradlePath) {
    let contents = fs.readFileSync(rootBuildGradlePath, 'utf8');

    if (contents.includes(CRASHLYTICS_MARKER)) {
        return; // already present, nothing to do
    }

    const dependenciesMatch = contents.match(/(buildscript\s*\{[\s\S]*?dependencies\s*\{)/);
    if (!dependenciesMatch) {
        throw new Error('OUTSYSTEMS_PLUGIN_ERROR: could not locate buildscript.dependencies block in ' + rootBuildGradlePath);
    }

    const insertion = `${dependenciesMatch[1]}\n        classpath '${CRASHLYTICS_CLASSPATH}'`;
    contents = contents.replace(dependenciesMatch[1], insertion);

    fs.writeFileSync(rootBuildGradlePath, contents);
}

function insertApplyPlugin(appBuildGradlePath) {
    let contents = fs.readFileSync(appBuildGradlePath, 'utf8');

    if (contents.includes(APPLY_MARKER)) {
        return; // already present, nothing to do
    }

    // Crashlytics needs the application plugin already applied
    const applicationPluginMatch = contents.match(/apply plugin:\s*['"]com\.android\.application['"]\s*\n?/);
    if (!applicationPluginMatch) {
        throw new Error('OUTSYSTEMS_PLUGIN_ERROR: could not locate `apply plugin: \'com.android.application\'` in ' + appBuildGradlePath);
    }

    const insertion = `${applicationPluginMatch[0]}apply plugin: ${APPLY_MARKER}\n`;
    contents = contents.replace(applicationPluginMatch[0], insertion);

    fs.writeFileSync(appBuildGradlePath, contents);
}

module.exports = function (context) {
    const projectRoot = context.opts.cordova.project ? context.opts.cordova.project.root : context.opts.projectRoot;

    const rootBuildGradlePath = path.join(projectRoot, 'platforms/android/build.gradle');
    const appBuildGradlePath = path.join(projectRoot, 'platforms/android/app/build.gradle');

    if (!fs.existsSync(rootBuildGradlePath) || !fs.existsSync(appBuildGradlePath)) {
        return; // android platform not present / not prepared yet
    }

    insertClasspath(rootBuildGradlePath);
    insertApplyPlugin(appBuildGradlePath);
};
