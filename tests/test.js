'use strict';

import {MongoClient} from 'mongodb';
import MongoStore from '../src/store';
import thunkify from 'thunkify';

const clone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

const describeStore = (msg, storeOptions, options={}) => {
  const {cleanDb=false} = options;
  let store;

  describe(msg, function() {
    const sess = {cookie: {maxAge: 2000}, name: 'name'};

    before(function (done) {
      store = new MongoStore(typeof storeOptions === 'function' ? storeOptions() : storeOptions)
        .on('connect', function (conn) {
          cleanDb && conn.db.dropDatabase();
          done();
        })
        .on('error', done);
    });

    it('should save session to db', function *() {
      const result = yield store.set('123', clone(sess));
      //noinspection BadExpressionStatementJS
      expect(result).to.be.ok;
    });

    it('should return saved session', function *() {
      const result = yield store.get('123');
      expect(result).to.deep.equal(sess);
    });

    it('should destroy session', function *() {
      yield store.destroy('123');
      const result = yield store.get('123');
      //noinspection BadExpressionStatementJS
      expect(result).to.not.ok;
    });

    it('should set ttl', function *() {
      const sess = {
        name: 'name'
      };
      yield store.set('123', sess, 12345);
      const col = yield store.col;
      const result = yield thunkify(col.findOne.bind(col))({sid: '123'}, {_id: 0});
      //noinspection BadExpressionStatementJS
      expect(result.ttl.valueOf()).to.be.ok;
    });
  });
};

describeStore('store from url', {url: 'mongodb://127.0.0.1:27017/test'}, {cleanDb: true});

describe('test auth', function() {
  let db;

  before(function *() {
      db = yield thunkify(MongoClient.connect)('mongodb://127.0.0.1:27017/testauth');
  });

  it('should add user', function *() {
    try {
      yield thunkify(db.removeUser.bind(db))('han');
    } catch (err) {
      //skip error
    }
    let user = yield thunkify(db.addUser.bind(db))('han', 'solo');
  });

  describeStore('store from db object', () => {return {db}}, {cleanDb: true});

  describeStore('auth store', {user: 'han', password: 'solo', db: 'testauth'});
});

describe('closed db', function() {
  let db, store;

  before(function *() {
    db = yield thunkify(MongoClient.connect)('mongodb://127.0.0.1:27017/test');
    yield thunkify(db.close.bind(db))();
    store = new MongoStore({db})
  });

  it('should crush', function *() {
    let throwsError;
    try {
      yield store.get('123');
    } catch (err) {
      throwsError = true;
    }
    assert(throwsError, 'should throw error');
  });
});

describe('url info exclusive', function () {
  it('should fail if host and url provided', function *() {
    assert.throw(() => {new MongoStore({url: 'mongodb://127.0.0.1:27017', host: 'localhost'})});
  });
  it('should fail if port and url provided', function *() {
    assert.throw(() => {new MongoStore({url: 'mongodb://127.0.0.1:27017', port: '27017'})});
  });
  it('should fail if db and url provided', function *() {
    assert.throw(() => {new MongoStore({url: 'mongodb://127.0.0.1:27017', db: 'admin'})});
  });
  it('should fail if ssl and url provided', function *() {
    assert.throw(() => {new MongoStore({url: 'mongodb://127.0.0.1:27017', ssl: true})});
  });
});
