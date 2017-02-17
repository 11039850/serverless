'use strict';

const fs = require('fs');
const path = require('path');

const BbPromise = require('bluebird');

module.exports = {
  updateDeployment() {
    return BbPromise.bind(this)
      .then(this.writeUpdateTemplateToDisk)
      .then(this.getDeployment)
      .then(this.update);
  },

  getDeployment() {
    return this.provider.request('deploymentmanager', 'deployments', 'list')
      .then((response) => {
        const deployment = response.deployments.find((dep) => {
          const name = `sls-${this.serverless.service.service}-${this.options.stage}`;
          return dep.name === name;
        });

        return deployment;
      });
  },

  update(deployment) {
    this.serverless.cli.log('Updating deployment...');

    const filePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-update.yml');

    const params = {
      deployment: `sls-${this.serverless.service.service}-${this.options.stage}`,
      resource: {
        name: `sls-${this.serverless.service.service}-${this.options.stage}`,
        fingerprint: deployment.fingerprint,
        target: {
          config: {
            content: fs.readFileSync(filePath).toString(),
          },
        },
      },
    };

    return this.provider.request('deploymentmanager', 'deployments', 'update', params)
      .then((response) => this.monitorDeployment(response, 'update'));
  },

  writeUpdateTemplateToDisk() {
    const filePath = path.join(this.serverless.config.servicePath,
      '.serverless', 'configuration-template-update.yml');

    this.serverless.utils.writeFileSync(filePath,
      this.serverless.service.provider.compiledConfigurationTemplate);

    return BbPromise.resolve();
  },
};
