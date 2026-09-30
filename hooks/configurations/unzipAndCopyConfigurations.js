"use strict";

var path = require("path");
var AdmZip = require("adm-zip");

var utils = require("./utilities");

var constants = {
  googleServices: "google-services"
};

module.exports = function(context) {
  return new Promise(function (resolve, reject) {
    var cordovaAbove7 = utils.isCordovaAbove(context, 7);

    var platform = context.opts.plugin.platform;
    var platformConfig = utils.getPlatformConfigs(platform);
    if (!platformConfig) {
      return utils.handleError("Invalid platform", reject);
    }

    var wwwPath = utils.getResourcesFolderPath(context, platform, platformConfig);
    var sourceFolderPath = utils.getSourceFolderPath(context, wwwPath);

    var googleServicesZipFile = utils.getZipFile(sourceFolderPath, constants.googleServices);
    if (!googleServicesZipFile) {
      return utils.handleError("No zip file found containing google services configuration file", reject);
    }

    var zip = new AdmZip(googleServicesZipFile);

    var targetPath = path.join(wwwPath, constants.googleServices);
    zip.extractAllTo(targetPath, true);

    var files = utils.getFilesFromPath(targetPath);
    if (!files) {
      return utils.handleError("No directory found", reject);
    }

    var fileName = files.find(function (name) {
      return name.endsWith(platformConfig.firebaseFileExtension);
    });
    if (!fileName) {
      return utils.handleError("No file found", reject);
    }

    var sourceFilePath = path.join(targetPath, fileName);
    var copyOperations = [];

    var pluginDestFilePath = path.join(context.opts.plugin.dir, fileName);
    if(!utils.checkIfFolderExists(pluginDestFilePath)){
      copyOperations.push(utils.copyFromSourceToDestPath(sourceFilePath, pluginDestFilePath));
    }

    if (cordovaAbove7) {
      var destPath = path.join(context.opts.projectRoot, "platforms", platform, "app");
      if (utils.checkIfFolderExists(destPath)) {
        var platformDestFilePath = path.join(destPath, fileName);
        if(!utils.checkIfFolderExists(platformDestFilePath)){
          copyOperations.push(utils.copyFromSourceToDestPath(sourceFilePath, platformDestFilePath));
        }
      }
    }

    Promise.all(copyOperations).then(resolve, reject);
  });
}
