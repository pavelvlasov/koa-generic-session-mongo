# koa-generic-session-mongo

MongoDB store for [koa-generic-session](https://github.com/koajs/generic-session) middleware backed by [node-mongodb-native](https://github.com/mongodb/node-mongodb-native).
Fork of [connect-to-mongo](https://github.com/2do2go/connect-to-mongo) store.

## Installation

```sh
  npm install koa-generic-session koa-generic-session-mongo --save
```

## Usage

### Example
```js
var koa = require('koa');
var session = require('koa-generic-session');
var MongoStore = require('koa-generic-session-mongo');

var app = koa();
app.keys = ['keys', 'keykeys'];
app.use(session({
  store: new MongoStore()
}));

app.use(function *() {
  switch (this.path) {
  case '/get':
    get.call(this);
    break;
  case '/remove':
    remove.call(this);
    break;
  }
});

function get() {
  var session = this.session;
  session.count = session.count || 0;
  session.count++;
  this.body = session.count;
}

function remove() {
  this.session = null;
  this.body = 0;
}

app.listen(8080);
```

## Options

  - `url` mongodb connection url (full connection string. host, port, db, ssl options will be ignored)
  - `db` mongodb-native database object or database name (`test` by default)
  - `collection` collection name (`sessions` by default)
  - `host` db hostname (`127.0.0.1` by default)
  - `port` db port (`27017` by default)
  - `ttl` ttl in milliseconds (if set it overrides cookie `maxAge`)
  - `user` user for MongoDB
  - `password` password for MongoDB authentication
  - `ssl` use SSL to connect to MongoDB (`false` by default)

## License 
MIT
