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

    const statementsToLookup = stackPolicy.filter(({ ResourceType }) => ResourceType);
    if(statementsToLookup.length === 0) {
      this.serverless.cli.log(`'serverless-stack-policy-by-resource-type' did not find any stack policy statements with property 'ResourceType'.`);
      return;
    }

    for(const statement of statementsToLookup) {
      const resourceTypes = new Set(statement.ResourceType);
      const notResources = new Set(statement.ExcludeResource);
      const resources = Object.entries(this.serverless.service.resources.Resources)
        .filter(([, { Type }]) => resourceTypes.has(Type))
        .map(([logicalResourceId]) => `LogicalResourceId/${logicalResourceId}`)
        .filter(resource => !notResources.has(resource));

      const newResources = [...new Set(
        (statement.Resource || []).concat(resources)
      )];

      statement.Resource = newResources.sort();
      delete statement.ExcludeResource;
      delete statement.ResourceType;
    }
  }
}

module.exports = StackPolicyByResourceType;
