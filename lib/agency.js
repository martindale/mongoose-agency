/**
* @module agency
*/

var events = require('eventemitter2');
var util = require('util');
var merge = require('merge');
var jobspec = require('./job');
var completionspec = require('./completion');

/**
* Create a job "agency" from which services may look for work
* @constructor
* @param {object} source - mongoose connection instance to use
* @param {object} options
* @param {object} options.jobModel - model name to use for jobs collection
* @param {object} options.completionModel - model name to use for jobs collection
* @param {boolean} options.debug - verbose log output
* @param {number} options.timeout - hours in progress before retrying job
* @param {boolean} options.logger - logger object
*/
function Agency(source, options) {
  if (!(this instanceof Agency)) {
    return new Agency(source, options);
  }

  events.EventEmitter2.call(this);
  
  options = (typeof options === 'object') ? options : {};

  if (!source) {
    throw new Error('Cannot create `Agency` without source');
  }

  if (typeof source.model !== 'function') {
    throw new Error('Source must be an instance of `mongoose.Connection');
  }

  this.source = source;
  this.options = merge(Object.create(Agency.DEFAULTS), options);

  this._debug('Initializing agency instance with options:', this.options);
  this._init();
};

util.inherits(Agency, events.EventEmitter2);

Agency.DEFAULTS = {
  jobModel: 'AgencyJob',
  completionModel: 'AgencyCompletion',
  debug: false,
  timeout: 0.25, // 15m 
  logger: console
};

/**
* Publish a job to the agency
* #publish
* @param {string} namespace - service namespace
* @param {object} data - job information
* @param {function} callback - callback for job complete
*/
Agency.prototype.publish = function(namespace, data, callback) {
  callback = (typeof callback === 'function') ? callback : new Function();
  
  var self = this;
  var Job = this.source.model(this.options.jobModel);
  var Completion = this.source.model(this.options.completionModel);

  this._debug('Publishing job to namespace %s', namespace);

  var job = Job.create(namespace, data, function(err) {
    if (err) {
      this._debug('Error publishing job:', err);
      return callback(err);
    }

    self._debug(
      'Job published to namespace %s - completion event reference is %s',
      namespace, job._ref
    );
    self.once(job._ref, callback);
  });

  return job;
};

/**
* Subscribe to jobs in the given namespace
* #subscribe
* @param {string} namespace - service namespace
* @param {function} handler - job executor function
*/
Agency.prototype.subscribe = function(namespace, handler) {
  var self = this;

  if (typeof handler !== 'function') {
    throw new Error('Cannot subscribe without specifying a handler');
  }

  this._debug('Subscribing to namespace %s', namespace);

  this.on(namespace, function(job) {
    handler(job.contents, function(err) {
      var Completion = self.source.model(self.options.completionModel);
      var params = Array.prototype.slice.call(arguments);
      
      Completion.create(job._ref, params, function(err) {
        self.emit.apply(self, [job._ref].concat(params));
      });
    });
  });

  return this;
};

/**
* Initialize the agency
* #_init
*/
Agency.prototype._init = function() {
  this._getStream();
  this._addHandlers();
};

/**
* Log debug message to console
* #_debug
*/
Agency.prototype._debug = function() {
  var log = this.options.logger;
  var debug = log.debug || log.info;
  
  if (this.options.debug) {
    debug.apply(log, Array.prototype.slice.call(arguments));
  }
};

/**
* Register job model and open tailable cursor
* #_getStream
*/
Agency.prototype._getStream = function() {
  this._debug('Registering job specification as storage model');

  var Schema = this.source.base ? this.source.base.Schema : this.source.Schema;

  var jobSchema = jobspec(Schema);
  var completionSchema = completionspec(Schema);
  
  var jobs = this.source.model(this.options.jobModel, jobSchema);
  var completions = this.source.model(
    this.options.completionModel,
    completionSchema
  );

  this._debug('Opening tailable cursor as stream');

  this._stream = jobs.find({
    $or: [
      // new and failed jobs
      {
        status: { $in: ['new', 'failed'] }
      },
      // jobs that started and didn't complete after `x` hours
      {
        status: 'started',
        started: { $lt: Date.now() - (this.options.timeout * 60 * 60 * 1000) }
      }
    ]
  }).tailable().stream();

  this._completions = completions.find({}).tailable().stream();
};

/**
* Dispatch events as jobs come through stream
* #_addHandlers
*/
Agency.prototype._addHandlers = function() {
  var self = this;
  
  this._debug('Registering job stream handlers');
  
  this._stream.on('data', function(job) {
    self.emit(job.namespace, job);
  });

  this._stream.on('error', function(err) {
    self.emit('error', err);
  });

  this._debug('Registering completion handlers');

  this._completions.on('data', function(completion) {
    self.emit.apply(self, [completion._ref].concat(completion.params));
  });

  this._completions.on('error', function(err) {
    self.emit('error', err);
  });
};

/**
* Expose Agency contructor
* #exports
*/
module.exports = Agency;
