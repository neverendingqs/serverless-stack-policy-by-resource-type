'use strict';

class StackPolicyByResourceType {
  constructor(serverless) {
    this.provider = serverless.getProvider('aws');
    this.serverless = serverless.service;
    this.hooks = {
      'before:package:finalize': this.lookupLogicalResourceIds.bind(this)
    };
  }

  lookupLogicalResourceIds() {
  }
}

module.exports = StackPolicyByResourceType;
