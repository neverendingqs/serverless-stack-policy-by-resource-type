'use strict';

class StackPolicyByResourceType {
  constructor(serverless) {
    this.provider = serverless.getProvider('aws');
    this.serverless = serverless;
    this.hooks = {
      'before:package:finalize': this.lookupLogicalResourceIds.bind(this)
    };
  }

  lookupLogicalResourceIds() {
    if(!this.serverless.service.provider.stackPolicy) {
      this.serverless.cli.log(`'serverless-stack-policy-by-resource-type' did not find a stack policy.`);
      return;
    }
  }
}

module.exports = StackPolicyByResourceType;
