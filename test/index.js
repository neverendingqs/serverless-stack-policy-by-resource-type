const chai = require('chai');
const should = chai.should();
const sinon = require('sinon');

const StackPolicyByResourceType = require('../src');

describe('index', function() {
  beforeEach(function() {
    this.sandbox = sinon.createSandbox();

    this.serverless = {
      getProvider: this.sandbox.stub()
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
});
