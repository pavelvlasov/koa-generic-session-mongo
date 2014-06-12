/*!
 * koa-sess-mongo-store
 * Copyright(c) 2013 Pavel Vlasov <freakycue@gmail.com>
 * MIT Licensed
 */

/**
 * One day in milliseconds.
 */

var oneDay = 86400 * 1000;

/**
 * Module dependencies
 */

var inherits = require('util').inherits,
  wrap = require('co-wrapper'),
  EventEmitter = require('events').EventEmitter;


module.exports = MongoStore;
/**
* Initialize MongoStore with the given `options`.
*
* @param {Object} options
* @api public
*/
function MongoStore(options) {
  var self = this;

  options = options || {};
  EventEmitter.call(this);
  this.ttl = options.ttl;

  // Create ttl and sid indexes
  function ensureIndexes() {
    var times = 2;
    function done(err) {
      if (err) throw err;
      if (--times < 1) {
        self.col = wrap(self.col);
        self.emit('connect');
      }
    }
    self.col.ensureIndex({ttl: 1}, {expireAfterSeconds: 0}, done);
    self.col.ensureIndex({sid: 1}, {unique: true}, done);
  }

  if (options.db && (typeof options.db !== 'string')) {
    this.col = options.db.collection(options.collection || 'sessions');
    ensureIndexes();
  } else {
    function makeConnectionString(options) {
      return  'mongodb://' + (options.host || '127.0.0.1') + ':' +
        (options.port || '27017') + '/' +
        (options.db || 'test') +
        '?ssl=' + (options.ssl || false);
    }
    new require('mongodb').MongoClient
    .connect(options.url || makeConnectionString(options), function(err, db) {
      if (err) throw err;
      self.col = db.collection(options.collection || 'sessions');
      if (options.user && options.password) {
        db.authenticate(options.user, options.password, function(err, res) {
          if (err) throw err;
          if (!res) throw new Error('mongodb authentication failed');
          ensureIndexes();
        });
      } else {
        ensureIndexes();
      }
    });
  }
};

/**
* Inherit from `EventEmitter`.
*/

inherits(MongoStore, EventEmitter);

/**
* Attempt to fetch session by the given `sid`.
*
* @param {String} sid
* @param {Function} fn
* @api public
*/

MongoStore.prototype.get = function *(sid){
  return yield this.col.findOne({sid: sid}, {_id: 0, ttl: 0, sid: 0});
};

/**
* Commit the given `sess` object associated with the given `sid`.
*
* @param {String} sid
* @param {Session} sess
* @param {Function} fn
* @api public
*/

MongoStore.prototype.set = function *(sid, sess) {
    var maxAge = sess.cookie.maxAge;

    sess.sid = sid;
    sess.ttl = new Date((this.ttl || ('number' == typeof maxAge
      ? maxAge : oneDay)) + Date.now());

    return yield this.col.update({sid: sid}, sess, {upsert: true});
};

/**
* Destroy the session associated with the given `sid`.
*
* @param {String} sid
* @api public
*/

MongoStore.prototype.destroy = function *(sid) {
  yield this.col.remove({sid: sid});
};
