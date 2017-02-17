'use strict';

const fs = require('fs');

const BbPromise = require('bluebird');
const _ = require('lodash');
const google = require('googleapis');

const constants = {
  providerName: 'google',
};

class GoogleProvider {
  static getProviderName() {
    return constants.providerName;
  }

  constructor(serverless) {
    this.serverless = serverless;
    this.provider = this; // only load plugin in a Google service context
    this.serverless.setProvider(constants.providerName, this);

    this.sdk = {
      deploymentmanager: google.deploymentmanager('v2'),
      storage: google.storage('v1'),
    };
  }

  request(service, namespace, method, params) {
    return new BbPromise((resolve, reject) => {
      this.isServiceSupported(this.sdk, service);

      const authClient = this.getAuthClient();

      authClient.authorize(() => {
        const requestParams = {
          auth: authClient,
          project: this.serverless.service.provider.project, // automagically reference the project
        };

        // merge the params from the request call into the base functionParams
        _.merge(requestParams, params);

        this.sdk[service][namespace][method](requestParams, (error, response) => {
          if (error) reject(new this.serverless.classes.Error(error));
          return resolve(response);
        });
      });
    });
  }

  getAuthClient() {
    const keyFileContent = fs.readFileSync(this.serverless.service.provider.credentials).toString();
    const key = JSON.parse(keyFileContent);

    return new google.auth.JWT(
      key.client_email,
      null,
      key.private_key,
      ['https://www.googleapis.com/auth/cloud-platform'],
      null
    );
  }

  isServiceSupported(sdk, service) {
    if (!Object.keys(sdk).includes(service)) {
      const errorMessage = [
        'Unsupported service... ',
        `Supported services are: ${Object.keys(sdk).join(', ')}`,
      ].join('');

      throw new this.serverless.classes.Error(errorMessage);
    }
  }
}

module.exports = GoogleProvider;
