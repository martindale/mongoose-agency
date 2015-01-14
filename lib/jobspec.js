/*
* @module jobspec
*/

module.exports = function(Schema) {

  /*
  * Job document specification
  * @constructor
  */
  var Job = new Schema({
    namespace: {
      type: String,
      required: true
    },
    contents: {
      type: Object,
      required: true
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
      default: 'new',
      enum: ['new', 'started', 'completed', 'failed']
    }
  }, {
    capped: {
      size: 10 * 1024 * 1024,
      autoIndexId: true
    }
  });

  Job.statics.create = function(namespace, contents, callback) {
    return new Job({
      namespace: namespace,
      contents: contents,
      created: Date.now(),
      status: 'new'
    }).save(callback);
  };
  
};