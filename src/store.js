/*!
 * koa-sess-mongo-store
 * Copyright(c) 2013 Pavel Vlasov <freakycue@gmail.com>
 * MIT Licensed
 */

/**
 * One day in milliseconds.
 * @type {number}
 */
const ONE_DAY = 86400 * 1000;
const DEFAULT_COLLECTION = 'sessions';

import {EventEmitter} from 'events';
import {MongoClient} from 'mongodb';
import thunkify from 'co-thunkify';

export default class MongoStore extends EventEmitter {
  /**
   * Initialize MongoStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */
  constructor(options = {}) {
    super();
    const {
      ttl,
      db,
      collection,
      url,
      user,
      password
      } = options;

    this.ttl = ttl;
    this.col = typeof db == 'string' ?
      this._initWithDb({db, collection}) :
      this._initWithUrl({
        url: url || MongoStore._makeConnectionString(options),
        user,
        password
      });
    this.col
      .then(MongoStore._ensureIndexes)
      .then(function () {
        self.emit('connect');
      });
  }

  _initWithDb({db, collection=DEFAULT_COLLECTION}) {
    return Promise.resolve(db.collection(collection));
  }

  _initWithUrl({url, user, password, collection=DEFAULT_COLLECTION}) {
    return new Promise((resolve, reject) => {
      new MongoClient().connect(url, function (err, db) {
        if (err) {
          reject(err);
          return;
        }
        const col = db.collection(collection);
        if (user && password) {
          db.authenticate(user, password, function (err, res) {
            if (err) {
              reject(err);
            } else if (!res) {
              throw new Error('mongodb authentication failed');
            } else {
              resolve(col);
            }
          });
        } else {
          resolve(col);
        }
      });
    })
  }

  static _makeConnectionString({host='127.0.0.1', port=27017, db='test', ssl=false}) {
    return `mongodb://${host}:${port})/${db}?ssl=${ssl}`;
  }

  /**
   * Create ttl and sid indexes
   * @param col
   * @returns {Promise}
   */
  static _ensureIndexes(col) {
    return new Promise(function (resolve, reject) {
      let times = 2;

      function done(err) {
        if (err) {
          reject(err);
        } else if (--times < 1) {
          resolve(col);
        }
      }

      col.ensureIndex({ttl: 1}, {expireAfterSeconds: 0}, done);
      col.ensureIndex({sid: 1}, {unique: true}, done);
    });
  }

  /**
   * Attempt to fetch session by the given `sid`.
   *
   * @param {String} sid
   * @param {Function} fn
   * @api public
   */
  *get(sid) {
    const col = yield this.col;
    const findOne = thunkify(col, col.findOne);

    return findOne({sid: sid}, {_id: 0, ttl: 0, sid: 0});
  }

  /**
   * Commit the given `sess` object associated with the given `sid`.
   *
   * @param {String} sid
   * @param {Session} sess
   * @api public
   */
  *set(sid, sess) {
    const maxAge = sess.cookie.maxAge;
    const col = yield this.col;
    const update = thunkify(col, col.update);

    sess.sid = sid;
    sess.ttl = new Date((this.ttl || ('number' == typeof maxAge
      ? maxAge : ONE_DAY)) + Date.now());

    return yield update({sid: sid}, sess, {upsert: true});
  }
  /**
   * Destroy the session associated with the given `sid`.
   *
   * @param {String} sid
   * @api public
   */
  *destroy(sid) {
    const col = yield this.col;
    const remove = thunkify(col, col.remove);

    yield remove({sid: sid});
  }
}
