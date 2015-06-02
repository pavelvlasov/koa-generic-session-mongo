/**
 * Module dependencies.
 */

var assert = require('assert'),
  co = require('co');
  MongoClient = require('mongodb').MongoClient,
  MongoStore = require('./');

var DB = 'koa_generic_session_test';
var testsCount = 4;

var done = (function () {
  var count = 0;
  return function () {
    ++count;
    if (count == testsCount) {
      // Cleanup test database
      MongoClient.connect('mongodb://127.0.0.1:27017/' + DB, function(err, db) {
        db.dropDatabase(DB, function (err) {
          if (err) throw err;
          console.log('done');
          process.exit(0);
        });
      });
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
  url: 'mongodb://127.0.0.1:27017/' + DB
});

// simple test
store.on('connect', function() {
  baseTest(this);
});

// test with initialized db object
MongoClient.connect('mongodb://127.0.0.1:27017/' + DB, function(err, db) {
  var store = new MongoStore({db: db});
  store.on('connect', function() {
    baseTest(this);
  });
});

// test mongodb auth
MongoClient.connect('mongodb://127.0.0.1:27017/' + DB, function(err, db) {
  db.addUser('user', 'pass', function(err, res) {
    assert.ok(!err, '#addUser error');
    var store = new MongoStore({user: 'user', password: 'pass', db: DB});
    store.on('connect', function() {
      baseTest(this);
    });
  });
  // Cleanup user
  db.removeUser('user', 'pass', function(err, res) { if (err) throw err });
});

// test throws error if url and extra connection info options are provided
(function url_and_connection_info_exclusive () {
  var error = /url option is exclusive/;
  assert.throws(function () {
    new MongoStore({url: 'mongodb://127.0.0.1:27017', host: 'localhost'});
  }, error);
  assert.throws(function () {
    new MongoStore({url: 'mongodb://127.0.0.1:27017', port: '27017'});
  }, error);
  assert.throws(function () {
    new MongoStore({url: 'mongodb://127.0.0.1:27017', db: DB});
  }, error);
  assert.throws(function () {
    new MongoStore({url: 'mongodb://127.0.0.1:27017', ssl: true});
  }, error);
  done();
})();
