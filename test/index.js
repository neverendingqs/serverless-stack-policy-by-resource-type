const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');

chai.use(require("sinon-chai"));

const StackPolicyByResourceType = require('../src');

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
    const noApplicableStatementsMsg = `'serverless-stack-policy-by-resource-type' did not find any stack policy statements with property 'ResourceType'.`;

    it('does nothing if it does not find a stack policy', function() {
      delete this.serverless.service.provider.stackPolicy;
      this.plugin.lookupLogicalResourceIds();
      this.serverless.cli.log.should.have.been.calledWith(`'serverless-stack-policy-by-resource-type' did not find a stack policy.`);
    });

    it('does nothing if there are no stack policy statements', function() {
      this.plugin.lookupLogicalResourceIds();
      this.serverless.cli.log.should.have.been.calledWith(noApplicableStatementsMsg);
    });

    it(`does nothing if there are no stack policy statements with property 'ResourceType'`, function() {
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
  });
});
