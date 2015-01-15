var expect = require('chai').expect;
var should = require('chai').should();
var mongoose = require('mongoose');
var sinon = require('sinon');
var Agency = require('../lib/agency');

var source, agency1, agency2, agency3, agency4, agency5;

before(function(done) {
  //mockgoose(mongoose);
  source = function() {
    return mongoose.createConnection('mongodb://localhost:27017/agency-test');
  };
  done();
});

after(function(done) {
  done();
});

describe('Agency', function() {

  describe('@constructor', function() {

    it('should not create an instance without a source', function(done) {
      expect(function() {
        return new Agency();
      }).to.throw;
      done();
    });

    it('should not create an instance with invalid source', function(done) {
      expect(function() {
        return new Agency({});
      }).to.throw;
      done();
    });

    it('should create an instance with valid source', function(done) {
      expect(function() {
        agency1 = new Agency(source());
        agency1.source.should.be.ok;
      }).not.to.throw;
      done();
    });

    it('should create an instance without the `new` keyword', function(done) {
      expect(function() {
        agency2 = Agency(source());
        agency2.source.should.be.ok;
      }).not.to.throw;
      done();
    });

    it('should create an instance with the given options', function(done) {
      expect(function() {
        agency3 = Agency(source(), { timeout: 1 });
        agency3.source.should.be.ok;
        agency3.options.timeout.should.equal(1);
      }).not.to.throw;
      done();
    });

  });

  describe('#publish', function() {

    it('should not create a job without namespace', function(done) {
      agency4 = Agency(source());
      expect(function() {
        agency4.publish();
      }).to.throw;
      done();
    });
    
    it('should create a job document in the database', function(done) {
      var job = agency4.publish('agency.test', { foo: 'bar' });
      process.nextTick(function() {
        var Job = agency4.source.model(agency4.options.jobModel);
        Job.findOne({ _id: job._id }, function(err, j) {
          should.not.exist(err);
          j.should.be.ok;
          done();
        });
      });
    });

  });

  describe('#subscribe', function() {

    it('should receive the job event at the given namespace', function(done) {
      agency5 = Agency(source());
      agency4.subscribe('agency.subscribe-test', function(jobdata) {
        expect(jobdata).to.be.ok;
        done();
      });
      agency5.publish('agency.subscribe-test', { foo: 'bar' });
    });

    it('should notify the agency when the job is completed', function(done) {
      agency5.subscribe('agency.completion-test', function(jobdata, complete) {
        expect(jobdata).to.be.ok;
        complete();
      });
      agency4.publish('agency.completion-test', { foo: 'bar' }, function(err) {
        expect(err).to.not.be.ok;
        done();
      });
    });

    it('should pass the arguments to the completion function', function(done) {
      agency5.subscribe('agency.argument-test', function(jobdata, complete) {
        complete(null, 'foo', 'bar', 'baz');
      });
      agency4.publish('agency.argument-test', {}, function(err, a, b, c) {
        expect(err).to.not.be.ok;
        expect(a).to.equal('foo');
        expect(b).to.equal('bar');
        expect(c).to.equal('baz');
        done();
      });
    });

  });

});
