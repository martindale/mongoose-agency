Mongoose-Agency
===============

A pub/sub job queue for mongoose and node.

## Quick Start

Install with NPM and add to your package.json:

```
npm install mongoose-agency --production --save
```

Require the module in your project:

```js
var Agency = require('mongoose-agency');
```

Create an `Agency` and give it your `mongoose.Connection`:

```js
var source = mongoose.connect('mongodb://host:port/name');
var agency = new Agency(source, options);
```

Publish work for other services to pick up:

```js
agency.publish('notifier.sms', {
  tel: '555-555-5555',
  message: 'Hello!'
}, function(err) {
  // job was completed by other service
});
```

Listen for published jobs and execute them:

```js
agency.subscribe('jobs.for.me', function(jobdata, done) {
  // do stuff with jobdata
  done();
});
```

That's it! Party!

## Agency(source, [options])

Creates a new `Agency` instance to communicate with other services using the same source.

### source

An instance of `mongoose.Connection` to use.

### options

An optional configuration object

#### jobModel

Name to use for the jobs collection. Default: `'AgencyJob'`.

#### completionModel

Name to use for the completions collection. Default: `'AgencyCompletion'`.

#### debug

Print verbose information to logger. Default: `false`.

#### timeout

Number of hours before a `started` job is considered `failed`. Default: `0.25`.

#### logger

Logger object that implements `info()` or `debug()`. Default: `console`.

## a.subscribe(namespace, handler)

Listen for jobs in the given namespace and handle them with the given handler.

### namespace

An [EventEmitter2](https://www.npmjs.com/package/eventemitter2) compatible string.

### handler

Function to execute job. Receives arguments `(data, complete)`.

#### data

Object containing the published job data.

#### complete

A function to call to notify the job publisher that the job is complete.
You may pass `n` arguments to the function, but the first is treated as an error. 

## a.publish(namespace, job, callback)

Publish a job for another service to complete and get notified of it's completion.

### namespace

An [EventEmitter2](https://www.npmjs.com/package/eventemitter2) compatible string.

### job

Object containing pertinent job data.

### callback

Function to be called when a receiving service completes the job.
There can be `n` arguments passed to the function, but the first is treated as an error.

## Testing

To run the integration tests, you'll need to have an instance of `mongod` running.

```
cd path/to/mongoose-agency && npm test
```
