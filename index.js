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
    const stackPolicy = this.serverless.service.provider.stackPolicy;
    if(!stackPolicy) {
      this.serverless.cli.log(`'serverless-stack-policy-by-resource-type' did not find a stack policy.`);
      return;
    }

    const policiesToLookup = stackPolicy.filter(({ ResourceType }) => ResourceType);
    if(policiesToLookup.length === 0) {
      this.serverless.cli.log(`'serverless-stack-policy-by-resource-type' did not find any stack policy statements with property 'ResourceType'.`);
      return;
    }
  }
}

module.exports = StackPolicyByResourceType;
