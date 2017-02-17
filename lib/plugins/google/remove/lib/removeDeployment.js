'use strict';

module.exports = {
  removeDeployment() {
    this.serverless.cli.log('Removing deployment...');

    const params = {
      deployment: `sls-${this.serverless.service.service}-${this.options.stage}`,
    };

    return this.provider.request('deploymentmanager', 'deployments', 'delete', params)
      .then((response) => this.monitorDeployment(response, 'remove'));
  },
};
