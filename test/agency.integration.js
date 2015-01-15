var expect = require('chai').expect;
var sinon = require('sinon');
var mongoose = require('mongoose');
var mockgoose = require('mockgoose');
var Agency = require('../lib/agency');

var agency1, agency2, agency3;

before(function(done) {
  mockgoose(mongoose);
  done();
});

after(function(done) {
  done();
});

describe('Agency', function() {

  describe('@constructor', function() {

    it('should not create an instance without a source', function(done) {

    });

    it('should not create an instance with invalid source', function(done) {

    });

    it('should create an instance with valid source', function(done) {

    });

    it('should create an instance without the `new` keyword', function(done) {

    });

    it('should create an instance with the given options', function(done) {

    });

  });

  describe('#publish', function() {

    it('should not create a job without namespace', function(done) {

    });
    
    it('should create a job document in the database', function(done) {

    });

  });

  describe('#subscribe', function() {

    it('should receive the job event at the given namespace', function(done) {

    });

    it('should notify the agency when the job is completed', function(done) {

    });

  });

});
