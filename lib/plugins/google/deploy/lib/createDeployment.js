'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  createDeployment() {
    return BbPromise.bind(this)
      .then(this.writeCreateTemplateToDisk)
      .then(this.checkForExistingDeployment)
      .then(this.createIfNotExists);
  },

  checkForExistingDeployment() {
    return this.provider.request('deploymentmanager', 'deployments', 'list')
      .then((response) => {
        let found = false;

        if (response && response.deployments) {
          found = !!response.deployments.find((deployment) => {
            const name = `sls-${this.serverless.service.service}-${this.options.stage}`;
            return deployment.name === name;
          });
        }

        return found;
      });
  },

  createIfNotExists(existingDeployment) {
    if (existingDeployment) {
      return BbPromise.resolve();
    }

    this.serverless.cli.log('Creating deployment...');

    const filePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-create.yml');

    const params = {
      resource: {
        name: `sls-${this.serverless.service.service}-${this.options.stage}`,
        target: {
          config: {
            content: fs.readFileSync(filePath).toString(),
          },
        },
      },
    };

    return this.provider.request('deploymentmanager', 'deployments', 'insert', params)
      .then((response) => this.monitorDeployment(response, 'create'));
  },

  writeCreateTemplateToDisk() {
    const filePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-create.yml');

    this.serverless.utils.writeFileSync(filePath,
      this.serverless.service.provider.compiledConfigurationTemplate);

    return BbPromise.resolve();
  },
};
