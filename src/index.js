'use strict';

class StackPolicyByResourceType {
  constructor(serverless) {
    console.log(serverless.configSchemaHandler.schema.properties.provider);
    try {
      // TODO: check if `configSchemaHandler` and `addPropertiesToSchema` exists
      serverless.configSchemaHandler.addPropertiesToSchema(
        serverless.configSchemaHandler.schema.properties.provider,
        {
          type: 'object',
          properties: {
            stackPolicy: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  ExcludeResource: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  ResourceType: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                }
              }
            }
          },
        }
      );
    } catch (err) {
      console.log('Property:', err.property);
      throw err;
    }

    this.provider = serverless.getProvider('aws');
    this.serverless = serverless;
    this.hooks = {
      'before:package:finalize': this.lookupLogicalResourceIds.bind(this)
    };
  }

  matchesPrefix(prefixes, logicalResource){
    return prefixes.filter(p => logicalResource.startsWith(p)).length > 0;
  }

  lookupLogicalResourceIds() {
    const stackPolicy = this.serverless.service.provider.stackPolicy;
    if(!stackPolicy) {
      this.serverless.cli.log("'serverless-stack-policy-by-resource-type' did not find a stack policy.");
      return;
    }

    const statementsToLookup = stackPolicy.filter(({ ResourceType }) => ResourceType);
    if(statementsToLookup.length === 0) {
      this.serverless.cli.log("'serverless-stack-policy-by-resource-type' did not find any stack policy statements with property 'ResourceType'.");
      return;
    }

    for(const statement of statementsToLookup) {
      const resourceTypes = new Set(statement.ResourceType);
      const notResources = new Set(statement.ExcludeResource);
      const notResourcePrefixes = statement.ExcludeResourcePrefix || [];
      const resources = Object.entries(this.serverless.service.resources.Resources)
        .filter(([, { Type }]) => resourceTypes.has(Type))
        .map(([logicalResourceId]) => `LogicalResourceId/${logicalResourceId}`)
        .filter(resource => !notResources.has(resource) && !this.matchesPrefix(notResourcePrefixes, resource));

      const newResources = [...new Set(
        (statement.Resource || []).concat(resources)
      )];

      statement.Resource = newResources.sort();
      delete statement.ExcludeResource;
      delete statement.ExcludeResourcePrefix;
      delete statement.ResourceType;
    }
  }
}

module.exports = StackPolicyByResourceType;
