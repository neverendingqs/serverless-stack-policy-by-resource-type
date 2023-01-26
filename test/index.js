const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');

chai.use(require('sinon-chai'));

const StackPolicyByResourceType = require('../src');

function createDdbResource() {
  return {
    Type: 'AWS::DynamoDB::Table',
    Properties: {
      AttributeDefinitions: [
        {
          AttributeName: 'k',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      KeySchema: [
        {
          AttributeName: 'k',
          KeyType: 'HASH'
        }
      ]
    }
  };
}

function createS3Resource() {
  return {
    Type: 'AWS::S3::Bucket'
  };
}

describe('index', function() {
  beforeEach(function() {
    this.sandbox = sinon.createSandbox();

    this.serverless = {
      cli: {
        log: this.sandbox.stub()
      },
      getProvider: this.sandbox.stub(),
      service: {
        provider: {
          stackPolicy: []
        },
        resources: {
          Resources: {}
        }
      }
    };

    this.provider = {};
    this.serverless.getProvider
      .withArgs('aws')
      .returns(this.provider);

    this.plugin = new StackPolicyByResourceType(this.serverless);
  });

  describe('constructor()', function() {
    it('creates plugin properly', function() {
      should.exist(this.plugin);
      this.plugin.provider.should.deep.equal(this.provider);

      const hook = this.plugin.hooks['before:package:finalize'];
      should.exist(hook);
      hook.name.should.equal('bound lookupLogicalResourceIds');
    });
  });

  describe('lookupLogicalResourceIds()', function() {
    const noApplicableStatementsMsg = "'serverless-stack-policy-by-resource-type' did not find any stack policy statements with property 'ResourceType'.";

    beforeEach(function() {
      Object.assign(
        this.serverless.service.resources.Resources,
        { DDBTable: createDdbResource() },
        { S3Bucket1: createS3Resource() },
        { AnotherS3Bucket: createS3Resource() }
      );
    });

    it('does nothing if it does not find a stack policy', function() {
      delete this.serverless.service.provider.stackPolicy;
      this.plugin.lookupLogicalResourceIds();
      this.serverless.cli.log.should.have.been.calledWith("'serverless-stack-policy-by-resource-type' did not find a stack policy.");
    });

    it('does nothing if there are no stack policy statements', function() {
      this.plugin.lookupLogicalResourceIds();
      this.serverless.cli.log.should.have.been.calledWith(noApplicableStatementsMsg);
    });

    it("does nothing if there are no stack policy statements with property 'ResourceType'", function() {
      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        {
          Effect: 'Deny',
          Principal: '*',
          Action: [
            'Update:Replace',
            'Update:Delete'
          ],
          Resource: [
            'LogicalResourceId/DDBTable'
          ]
        }
      );

      this.plugin.lookupLogicalResourceIds();
      this.serverless.cli.log.should.have.been.calledWith(noApplicableStatementsMsg);
    });

    it('looks up resources by type and adds it to the stack policy statement', function() {
      const statement = {
        Effect: 'Deny',
        Principal: '*',
        Action: [
          'Update:Replace',
          'Update:Delete'
        ],
        Resource: [
          'LogicalResourceId/DDBTable'
        ],
        ResourceType: [
          'AWS::S3::Bucket'
        ]
      };

      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        statement
      );

      this.plugin.lookupLogicalResourceIds();
      statement.Resource.should.have.members([
        'LogicalResourceId/DDBTable',
        'LogicalResourceId/S3Bucket1',
        'LogicalResourceId/AnotherS3Bucket'
      ]);
      should.not.exist(statement.ResourceType);
      should.not.exist(statement.ExcludeResource);
      should.not.exist(statement.ExcludeResourcePrefix);
    });

    it("filters out resources based on 'ExcludeResource' in the stack policy statement", function() {
      const statement = {
        Effect: 'Deny',
        Principal: '*',
        Action: [
          'Update:Replace',
          'Update:Delete'
        ],
        Resource: [
          'LogicalResourceId/DDBTable'
        ],
        ResourceType: [
          'AWS::S3::Bucket'
        ],
        ExcludeResource: [
          'LogicalResourceId/S3Bucket1'
        ]
      };

      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        statement
      );

      this.plugin.lookupLogicalResourceIds();
      statement.Resource.should.have.members([
        'LogicalResourceId/DDBTable',
        'LogicalResourceId/AnotherS3Bucket'
      ]);
      should.not.exist(statement.ResourceType);
      should.not.exist(statement.ExcludeResource);
      should.not.exist(statement.ExcludeResourcePrefix);
    });

    it("filters out resources based on 'ExcludeResourcePrefix' in the stack policy statement", function() {
      const statement = {
        Effect: 'Deny',
        Principal: '*',
        Action: [
          'Update:Replace',
          'Update:Delete'
        ],
        Resource: [
          'LogicalResourceId/DDBTable'
        ],
        ResourceType: [
          'AWS::S3::Bucket'
        ],
        ExcludeResourcePrefix: [
          'LogicalResourceId/S3Buck'
        ]
      };

      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        statement
      );

      this.plugin.lookupLogicalResourceIds();
      statement.Resource.should.have.members([
        'LogicalResourceId/DDBTable',
        'LogicalResourceId/AnotherS3Bucket'
      ]);
      should.not.exist(statement.ResourceType);
      should.not.exist(statement.ExcludeResource);
      should.not.exist(statement.ExcludeResourcePrefix);
    });

    it("filters out resources based on 'ExcludeResource' and  'ExcludeResourcePrefix' in the stack policy statement", function() {
      const statement = {
        Effect: 'Deny',
        Principal: '*',
        Action: [
          'Update:Replace',
          'Update:Delete'
        ],
        Resource: [
          'LogicalResourceId/DDBTable'
        ],
        ResourceType: [
          'AWS::S3::Bucket'
        ],
        ExcludeResource: [
          'LogicalResourceId/S3Bucket1'
        ],
        ExcludeResourcePrefix: [
          'LogicalResourceId/Another'
        ]
      };

      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        statement
      );

      this.plugin.lookupLogicalResourceIds();
      statement.Resource.should.have.members([
        'LogicalResourceId/DDBTable'
      ]);
      should.not.exist(statement.ResourceType);
      should.not.exist(statement.ExcludeResource);
      should.not.exist(statement.ExcludeResourcePrefix);
    });

    it("works even if 'Resource' property does not exist in the stack policy statement", function() {
      const statement = {
        Effect: 'Deny',
        Principal: '*',
        Action: [
          'Update:Replace',
          'Update:Delete'
        ],
        ResourceType: [
          'AWS::S3::Bucket'
        ],
        ExcludeResource: [
          'LogicalResourceId/S3Bucket1'
        ]
      };

      this.serverless.service.provider.stackPolicy.push(
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 'Update:*',
          Resource: '*'
        },
        statement
      );

      this.plugin.lookupLogicalResourceIds();
      statement.Resource.should.have.members([
        'LogicalResourceId/AnotherS3Bucket'
      ]);
      should.not.exist(statement.ResourceType);
      should.not.exist(statement.ExcludeResourcePrefix);
    });
  });
});
