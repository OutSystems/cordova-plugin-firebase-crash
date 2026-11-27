const path = require('path');
const fs = require('fs');

const CRASHLYTICS_CLASSPATH = "com.google.firebase:firebase-crashlytics-gradle:3.0.7";
const CRASHLYTICS_MARKER = 'firebase-crashlytics-gradle';
const GOOGLE_SERVICES_MARKER = 'com.google.gms:google-services';
const GOOGLE_SERVICES_APPLY = "apply plugin: 'com.google.gms.google-services'";
// Crashlytics Gradle plugin 3 requires Google-Services 4.4.1+
const MIN_GOOGLE_SERVICES_VERSION = '4.4.1';
const DEFAULT_GOOGLE_SERVICES_VERSION = '4.4.2';
const APPLY_MARKER = 'com.google.firebase.crashlytics.buildtools.gradle.CrashlyticsPlugin';
const GOOGLE_SERVICES_LITERAL = /(['"])com\.google\.gms:google-services:(\d+(?:\.\d+)*)\1/;

// Compares the numeric parts only (4.4.1 vs 4.10.0); returns <0, 0 or >0
function compareVersions(a, b) {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        const diff = (pa[i] || 0) - (pb[i] || 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

// The version is the app's (GradlePluginGoogleServicesVersion), not one pinned by this plugin
function getGoogleServicesVersion(platformAndroidPath) {
    let configured;
    try {
        const config = JSON.parse(fs.readFileSync(path.join(platformAndroidPath, 'cdv-gradle-config.json'), 'utf8'));
        configured = config.GRADLE_PLUGIN_GOOGLE_SERVICES_VERSION;
    } catch (e) {
        return DEFAULT_GOOGLE_SERVICES_VERSION;
    }

    if (!configured) {
        return DEFAULT_GOOGLE_SERVICES_VERSION;
    }
    if (!/^\d+(\.\d+)*$/.test(configured) || compareVersions(configured, MIN_GOOGLE_SERVICES_VERSION) < 0) {
        console.warn(`cordova-plugin-firebase-crash: GradlePluginGoogleServicesVersion ${configured} is not supported by ` +
            `Crashlytics Gradle plugin 3 (needs ${MIN_GOOGLE_SERVICES_VERSION}+), using ${DEFAULT_GOOGLE_SERVICES_VERSION}`);
        return DEFAULT_GOOGLE_SERVICES_VERSION;
    }
    return configured;
}

function insertClasspath(rootBuildGradlePath, googleServicesVersion) {
    let contents = fs.readFileSync(rootBuildGradlePath, 'utf8');
    const original = contents;

    const classpaths = [];
    if (!contents.includes(CRASHLYTICS_MARKER)) {
        classpaths.push(CRASHLYTICS_CLASSPATH);
    }
    // Both plugins must be on the root classpath: Crashlytics loads Google-Services classes by name
    const existing = contents.match(GOOGLE_SERVICES_LITERAL);
    if (!existing) {
        if (contents.includes(GOOGLE_SERVICES_MARKER)) {
            // e.g. a version defined through a Gradle variable, which can't be read here
            console.warn('cordova-plugin-firebase-crash: google-services version in ' +
                `${rootBuildGradlePath} is not a plain version, so it was left as is and not checked. ` +
                `Crashlytics Gradle plugin 3 needs ${MIN_GOOGLE_SERVICES_VERSION}+, the release build may fail if it is lower`);
        } else {
            classpaths.push(`${GOOGLE_SERVICES_MARKER}:${googleServicesVersion}`);
        }
    } else if (compareVersions(existing[2], MIN_GOOGLE_SERVICES_VERSION) < 0) {
        console.warn(`cordova-plugin-firebase-crash: raising google-services ${existing[2]} to ${googleServicesVersion} in ${rootBuildGradlePath}`);
        contents = contents.replace(GOOGLE_SERVICES_LITERAL, `$1${GOOGLE_SERVICES_MARKER}:${googleServicesVersion}$1`);
    }

    if (classpaths.length > 0) {
        const dependenciesMatch = contents.match(/(buildscript\s*\{[\s\S]*?dependencies\s*\{)/);
        if (!dependenciesMatch) {
            throw new Error('OUTSYSTEMS_PLUGIN_ERROR: could not locate buildscript.dependencies block in ' + rootBuildGradlePath);
        }

        const insertion = dependenciesMatch[1] + classpaths.map(c => `\n        classpath '${c}'`).join('');
        contents = contents.replace(dependenciesMatch[1], insertion);
    }

    if (contents !== original) {
        fs.writeFileSync(rootBuildGradlePath, contents);
    }
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

    // Crashlytics looks up the Google-Services tasks when it registers the mapping file upload
    // (builds with R8 on), so Google-Services has to be applied, by id, before it. Applying it again
    // later (e.g. the template, when GradlePluginGoogleServicesEnabled is true) is a no-op.
    const insertion = `${applicationPluginMatch[0]}${GOOGLE_SERVICES_APPLY}\napply plugin: ${APPLY_MARKER}\n`;
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

    insertClasspath(rootBuildGradlePath, getGoogleServicesVersion(path.join(projectRoot, 'platforms/android')));
    insertApplyPlugin(appBuildGradlePath);
};
