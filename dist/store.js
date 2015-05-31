/*!
 * koa-sess-mongo-store
 * Copyright(c) 2013 Pavel Vlasov <freakycue@gmail.com>
 * MIT Licensed
 */

/**
 * One day in milliseconds.
 * @type {number}
 */
'use strict';

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _get = require('babel-runtime/helpers/get')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _Object$defineProperty = require('babel-runtime/core-js/object/define-property')['default'];

var _Promise = require('babel-runtime/core-js/promise')['default'];

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

_Object$defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _mongodb = require('mongodb');

var _coThunkify = require('co-thunkify');

var _coThunkify2 = _interopRequireDefault(_coThunkify);

var ONE_DAY = 86400 * 1000;
var DEFAULT_COLLECTION = 'sessions';

var MongoStore = (function (_EventEmitter) {
  /**
   * Initialize MongoStore with the given `options`.
   *
   * @param {Object} options
   * @api public
   */

  function MongoStore() {
    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, MongoStore);

    _get(Object.getPrototypeOf(MongoStore.prototype), 'constructor', this).call(this);
    var ttl = options.ttl;
    var db = options.db;
    var collection = options.collection;
    var url = options.url;
    var user = options.user;
    var password = options.password;

    this.ttl = ttl;
    this.col = typeof db == 'string' ? this._initWithDb({ db: db, collection: collection }) : this._initWithUrl({
      url: url || MongoStore._makeConnectionString(options),
      user: user,
      password: password
    });
    this.col.then(MongoStore._ensureIndexes).then(function () {
      self.emit('connect');
    });
  }

  _inherits(MongoStore, _EventEmitter);

  _createClass(MongoStore, [{
    key: '_initWithDb',
    value: function _initWithDb(_ref) {
      var db = _ref.db;
      var _ref$collection = _ref.collection;
      var collection = _ref$collection === undefined ? DEFAULT_COLLECTION : _ref$collection;

      return _Promise.resolve(db.collection(collection));
    }
  }, {
    key: '_initWithUrl',
    value: function _initWithUrl(_ref2) {
      var url = _ref2.url;
      var user = _ref2.user;
      var password = _ref2.password;
      var _ref2$collection = _ref2.collection;
      var collection = _ref2$collection === undefined ? DEFAULT_COLLECTION : _ref2$collection;

      return new _Promise(function (resolve, reject) {
        new _mongodb.MongoClient().connect(url, function (err, db) {
          if (err) {
            reject(err);
            return;
          }
          var col = db.collection(collection);
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
      });
    }
  }, {
    key: 'get',

    /**
     * Attempt to fetch session by the given `sid`.
     *
     * @param {String} sid
     * @param {Function} fn
     * @api public
     */
    value: _regeneratorRuntime.mark(function get(sid) {
      var col, findOne;
      return _regeneratorRuntime.wrap(function get$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.next = 2;
            return this.col;

          case 2:
            col = context$2$0.sent;
            findOne = (0, _coThunkify2['default'])(col, col.findOne);
            return context$2$0.abrupt('return', findOne({ sid: sid }, { _id: 0, ttl: 0, sid: 0 }));

          case 5:
          case 'end':
            return context$2$0.stop();
        }
      }, get, this);
    })
  }, {
    key: 'set',

    /**
     * Commit the given `sess` object associated with the given `sid`.
     *
     * @param {String} sid
     * @param {Session} sess
     * @api public
     */
    value: _regeneratorRuntime.mark(function set(sid, sess) {
      var maxAge, col, update;
      return _regeneratorRuntime.wrap(function set$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            maxAge = sess.cookie.maxAge;
            context$2$0.next = 3;
            return this.col;

          case 3:
            col = context$2$0.sent;
            update = (0, _coThunkify2['default'])(col, col.update);

            sess.sid = sid;
            sess.ttl = new Date((this.ttl || ('number' == typeof maxAge ? maxAge : ONE_DAY)) + Date.now());

            context$2$0.next = 9;
            return update({ sid: sid }, sess, { upsert: true });

          case 9:
            return context$2$0.abrupt('return', context$2$0.sent);

          case 10:
          case 'end':
            return context$2$0.stop();
        }
      }, set, this);
    })
  }, {
    key: 'destroy',

    /**
     * Destroy the session associated with the given `sid`.
     *
     * @param {String} sid
     * @api public
     */
    value: _regeneratorRuntime.mark(function destroy(sid) {
      var col, remove;
      return _regeneratorRuntime.wrap(function destroy$(context$2$0) {
        while (1) switch (context$2$0.prev = context$2$0.next) {
          case 0:
            context$2$0.next = 2;
            return this.col;

          case 2:
            col = context$2$0.sent;
            remove = (0, _coThunkify2['default'])(col, col.remove);
            context$2$0.next = 6;
            return remove({ sid: sid });

          case 6:
          case 'end':
            return context$2$0.stop();
        }
      }, destroy, this);
    })
  }], [{
    key: '_makeConnectionString',
    value: function _makeConnectionString(_ref3) {
      var _ref3$host = _ref3.host;
      var host = _ref3$host === undefined ? '127.0.0.1' : _ref3$host;
      var _ref3$port = _ref3.port;
      var port = _ref3$port === undefined ? 27017 : _ref3$port;
      var _ref3$db = _ref3.db;
      var db = _ref3$db === undefined ? 'test' : _ref3$db;
      var _ref3$ssl = _ref3.ssl;
      var ssl = _ref3$ssl === undefined ? false : _ref3$ssl;

      return 'mongodb://' + host + ':' + port + ')/' + db + '?ssl=' + ssl;
    }
  }, {
    key: '_ensureIndexes',

    /**
     * Create ttl and sid indexes
     * @param col
     * @returns {Promise}
     */
    value: function _ensureIndexes(col) {
      return new _Promise(function (resolve, reject) {
        var times = 2;

        function done(err) {
          if (err) {
            reject(err);
          } else if (--times < 1) {
            resolve(col);
          }
        }

        col.ensureIndex({ ttl: 1 }, { expireAfterSeconds: 0 }, done);
        col.ensureIndex({ sid: 1 }, { unique: true }, done);
      });
    }
  }]);

  return MongoStore;
})(_events.EventEmitter);

exports['default'] = MongoStore;
module.exports = exports['default'];