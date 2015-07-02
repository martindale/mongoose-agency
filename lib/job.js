/**
* @module job
*/

var createUID = require('hat').rack();

module.exports = function(Schema) {

  /**
  * Job document specification
  * @constructor
  */
  var Job = new Schema({
    namespace: {
      type: String,
      required: true
    },
    contents: {
      type: Object
    },
    created: {
      type: Date,
      default: Date.now
    },
    started: {
      type: Date
    },
    completed: {
      type: Date
    },
    status: {
      type: String,
      default: '0',
      enum: ['0', '1', '2', '3']
    },
    _ref: {
      type: String,
      default: createUID
    }
  }, {
    capped: {
      size: 10 * 1024 * 1024,
      autoIndexId: true
    }
  });

  Job.statics.create = function(namespace, contents, callback) {
    var Job = this;

    var job = new Job({
      namespace: namespace,
      contents: contents,
      created: Date.now(),
      status: 0,
      _ref: createUID()
    });

    job.save(callback);

    return job;
  };

  return Job;

};
