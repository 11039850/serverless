'use strict';

const BbPromise = require('bluebird');
const async = require('async');

module.exports = {
  monitorDeployment(deployment, action, frequency) {
    const validStatuses = [
      'DONE',
    ];

    let deploymentStatus = null;

    this.serverless.cli.log(`Checking deployment ${action} progress...`);

    return new BbPromise((resolve, reject) => {
      async.whilst(
        () => (!validStatuses.includes(deploymentStatus)), // TODO: use indexOf
        (callback) => {
          setTimeout(() => {
            return this.provider.request('deploymentmanager', 'deployments', 'list')
              .then((response) => {
                // if actions is "remove" and no deployments are left set to done
                if (!response.deployments && action === 'remove') {
                  deploymentStatus = 'DONE';
                  callback();
                }

                const dep = response.deployments.find((singleDeployment) => {
                  const name = `sls-${this.serverless.service.service}-${this.options.stage}`;
                  return singleDeployment.name === name;
                });

                // if actions is "remove" and deployment disappears then set to "done"
                if (!dep && action === 'remove') {
                  deploymentStatus = 'DONE';
                  callback();
                }

                deploymentStatus = dep.operation.status;

                this.serverless.cli.printDot();
                return callback();
              })
              .catch((error) => {
                reject(new this.serverless.classes.Error(error.message));
              });
          }, frequency || 5000);
        },
        () => {
          // empty console.log for a prettier output
          this.serverless.cli.consoleLog('');
          this.serverless.cli.log('Done...');
          resolve(deploymentStatus);
        });
    });
  },
};
