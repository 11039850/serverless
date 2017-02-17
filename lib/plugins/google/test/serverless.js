'use strict';

// mock of the serverless instance
class Serverless {
  constructor() {
    this.providers = {};

    this.classes = {};
    this.classes.Error = Error;

    this.service = {};
    this.service.getAllFunctions = function () {
      return Object.keys(this.functions);
    };
    this.service.getFunction = function (functionName) {
      return this.functions[functionName];
    };
    this.utils = {
      writeFileSync() {},
      readFileSync() {},
    };

    this.cli = {
      log() {},
    };
  }

  setProvider(name, provider) {
    this.providers[name] = provider;
  }

  getProvider(name) {
    return this.providers[name];
  }
}

module.exports = Serverless;
