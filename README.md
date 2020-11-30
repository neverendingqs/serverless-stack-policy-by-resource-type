# serverless-stack-policy-by-resource-type

Serverless Framework plugin for automatically populating stack policy statements by resource type.

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

The following example will prevent CloudFormation from replacing or deleting the `DDBTable` resource or any S3 buckets:

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
      Resource:
        - LogicalResourceId/DDBTable
      # These resource types are parsed by this plugin
      # and converted to additional entries in `Resource`.
      ResourceType:
        - AWS::S3::Bucket
```
