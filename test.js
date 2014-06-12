/**
 * Module dependencies.
 */

var assert = require('assert'),
  co = require('co');
  MongoClient = require('mongodb').MongoClient,
  MongoStore = require('./');

var testsCount = 3;

var done = (function () {
  var count = 0;
  return function () {
    ++count;
    if (count == testsCount) {
      console.log('done');
      process.exit(0);
    }
  };
})();

var baseTest = co(function *(store) {
  // #set()
  var ok = yield store.set('123', {cookie: {maxAge: 2000}, name: 'name'});
  assert.ok(ok, '#set() is not ok');
  
  // #get()
  var data = yield store.get('123');
  assert.deepEqual({
    cookie: {maxAge: 2000},
    name: 'name'
  }, data);

  // #set null
  yield store.set('123', {cookie: {maxAge: 2000}, name: 'name'});
  yield store.destroy('123');
  done();
});

var store = new MongoStore({
  url: 'mongodb://127.0.0.1:27017/test'
});

// simple test
store.on('connect', function() {
  baseTest(this);
});

// test with initialized db object
MongoClient.connect('mongodb://127.0.0.1:27017/testdb', function(err, db) {
  var store = new MongoStore({db: db});
  store.on('connect', function() {
    baseTest(this);
  });
});

// test mongodb auth
MongoClient.connect('mongodb://127.0.0.1:27017/testauth', function(err, db) {
  db.addUser('user', 'pass', function(err, res) {
    assert.ok(!err, '#addUser error');
    var store = new MongoStore({user: 'user', password: 'pass', db: 'testauth'});
    store.on('connect', function() {
      baseTest(this);
    });
  });
});
