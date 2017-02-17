'use strict';

/* eslint no-use-before-define: 0 */

const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  compileFunctions() {
    const artifactFilePath = this.serverless.service.package.artifact;
    const fileName = artifactFilePath.split(path.sep).pop();

    this.serverless.service.package
      .artifactFilePath = `${this.serverless.service.package.artifactDirectoryName}/${fileName}`;

    this.serverless.service.getAllFunctions().forEach((functionName) => {
      const funcObject = this.serverless.service.getFunction(functionName);

      this.serverless.cli
        .log(`Compiling function "${functionName}"...`);

      validateHandlerProperty(funcObject, functionName);
      validateEventsProperty(funcObject, functionName);

      const funcTemplate = getFunctionTemplate(
        functionName,
        funcObject,
        this.options.region,
        `gs://sls-${
          this.serverless.service.service
        }-${this.options.stage}/${this.serverless.service.package.artifactFilePath}`
      );

      const eventType = Object.keys(funcObject.events[0])[0];

      if (eventType === 'http') {
        funcTemplate.properties.httpsTrigger = {
          url: funcObject.events[0].http,
        };
      }

      this.serverless.service.provider.compiledConfigurationTemplate.resources.push(funcTemplate);
    });

    return BbPromise.resolve();
  },
};

const validateHandlerProperty = (funcObject, functionName) => {
  if (!funcObject.handler) {
    const errorMessage = [
      `Missing "handler" property for function "${functionName}".`,
      ' Your function needs a "handler".',
      ' Please check the docs for more info.',
    ].join('');
    throw new this.serverless.classes.Error(errorMessage);
  }
};

const validateEventsProperty = (funcObject, functionName) => {
  if (!funcObject.events || funcObject.events.length === 0) {
    const errorMessage = [
      `Missing "events" property for function "${functionName}".`,
      ' Your function needs at least one "event".',
      ' Please check the docs for more info.',
    ].join('');
    throw new this.serverless.classes.Error(errorMessage);
  }
  if (funcObject.events.length > 1) {
    const errorMessage = [
      `The function "${functionName}" has more than one event.`,
      ' Only one event per function is supported.',
      ' Please check the docs for more info.',
    ].join('');
    throw new this.serverless.classes.Error(errorMessage);
  }
};

const getFunctionTemplate = (functionName, funcObject, region, sourceArchiveUrl) => { //eslint-disable-line
  return {
    type: 'cloudfunctions.v1beta2.function',
    name: functionName,
    properties: {
      location: region,
      function: funcObject.handler,
      sourceArchiveUrl,
    },
  };
};
