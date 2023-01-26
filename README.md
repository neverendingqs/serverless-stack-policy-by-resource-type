[![CircleCI](https://circleci.com/gh/neverendingqs/serverless-stack-policy-by-resource-type.svg?style=svg)](https://circleci.com/gh/neverendingqs/serverless-stack-policy-by-resource-type.svg)
[![Coverage
Status](https://coveralls.io/repos/github/neverendingqs/serverless-stack-policy-by-resource-type/badge.svg?branch=main)](https://coveralls.io/github/neverendingqs/serverless-stack-policy-by-resource-type?branch=main)
[![npm
version](https://badge.fury.io/js/serverless-stack-policy-by-resource-type.svg)](https://badge.fury.io/js/serverless-stack-policy-by-resource-type)

# serverless-stack-policy-by-resource-type

Serverless Framework plugin for automatically populating CloudFormation stack
policy statements by resource type.

CloudFormation stack policies allow you to protect a resource from being
accidentally replaced or deleted. However, it is easy to forget to update the
stack policy when adding new resources that should be protected. This plugin
accepts a list of resource types and automatically updates the stack policy upon
new resources of that type.

For example, if all DynamoDB tables should be protected from replacement or
deleted, you simply have to add

```yaml
ResourceType:
  - AWS::DynamoDB::Table
```

to your stack policy statement.

## Usage

Install the plugin:

```sh
npm install -D serverless-stack-policy-by-resource-type
```

Register the plugin in `serverless.yml`:

```yaml
plugins:
  - serverless-stack-policy-by-resource-type
```

The following example will prevent CloudFormation from replacing or deleting the
`DDBTable` resource or any S3 buckets except for the `LoggingBucket` S3 bucket:

```yaml
provider:
  ...
  stackPolicy:
    - Effect: Allow
      Principal: '*'
      Action: 'Update:*'
      Resource: '*'
    - Effect: Deny
      Principal: '*'
      Action:
        - Update:Replace
        - Update:Delete

      # These resources are included in the stack policy statement.
      Resource:
        - LogicalResourceId/DDBTable

      # These resource types are parsed by this plugin
      # and converted to additional entries in `Resource`.
      ResourceType:
        - AWS::S3::Bucket

      # These resources are excluded from `Resource` after all resources by type are added.
      # This property allows you to intentionally remove a resource.
      ExcludeResource:
        - LogicalResourceId/LoggingBucket

      # Any resources matching this prefix are excluded from `Resource` after all resources by type are added.
      # This property allows you to intentionally remove a collection of resources which share the same prefix.
      ExcludeResourcePrefix:
        - LogicalResourceId/Logging
```
