Mongoose-Agency
===============

A pub/sub job queue for mongoose and node.

## Quick Start

```js
var Agency = require('mongoose-agency');

var source = mongoose.connect('mongodb://host:port/name');
var agency = new Agency(source, options);

// publish some work to be done by another service
agency.publish('notifier.sms', {
  tel: '555-555-5555',
  message: 'Hello!'
}, function(err) {
  // job was completed by other service
});

// pick up work from other services
agency.subscribe('jobs.for.me', function(jobdata, done) {
  // do stuff with jobdata
  // ...
  done(); // let the publisher know the job is complete
});
```

## Agency(source, [options])
