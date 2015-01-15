/**
* @module completion
*/


module.exports = function(Schema) {

  /**
  * Completion document specification
  * @constructor
  */
  var Completion = new Schema({
    _ref: {
      type: String,
      required: true
    },
    params: [Schema.Types.Mixed]
  }, {
    capped: {
      size: 10 * 1024 * 1024,
      autoIndexId: true
    }
  });

  Completion.statics.create = function(uid, params, callback) {
    var Completion = this;
    var completion = new Completion({ _ref: uid, params: params });

    completion.save(callback);

    return completion;
  };

  return Completion;
  
};
