/*
* @module agency
*/

var events = require('eventemitter2');
var util = require('util');
var merge = require('merge');
var jobspec = require('./job');

/*
* Create a job "agency" from which services may look for work
* @constructor
* @param {object} source - mongoose connection instance to use
* @param {object} options
* @param {object} options.model - model name to use for jobs collection
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

  this._init();
};

util.inherits(Agency, events.EventEmitter2);

Agency.DEFAULTS = {
  model: 'AgencyJob',
  debug: false,
  timeout: 24, 
  logger: console
};

/*
* Log debug message to console
* #_debug
*/
Agency.prototype._debug = function() {
  var log = this.options.logger;
  
  if (this.options.debug) {
    log.debug.apply(log, Array.prototype.slice.call(arguments));
  }
};

/*
* Register job model and open tailable cursor
* #_init
*/
Agency.prototype._init = function() {
  var schema = jobspec(this.source.Schema);
  var jobs = this.source.model(this.options.model, schema);

  return this.stream = jobs.find({
    $or: [
      // new and failed jobs
      {
        status: { $in: ['new', 'failed']
      },
      // jobs that started and didn't complete after `x` hours
      {
        status: 'started',
        started: { $lt: Date.now() - (this.options.timeout * 60 * 60 * 1000) }
      }
    ]
  }).tailable().stream();
};
