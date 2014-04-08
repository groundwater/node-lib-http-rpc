# http rpc

> rpc over http using streams

[![Build Status](https://travis-ci.org/groundwater/node-lib-http-rpc.png?branch=master)](https://travis-ci.org/groundwater/node-lib-http-rpc)
[![NPM version](https://badge.fury.io/js/lib-http-rpc.png)](http://badge.fury.io/js/lib-http-rpc)

Build *both* the client and server from a common interface.

## Install

```bash
npm install --save lib-http-rpc
```

## Usage

### Common

Specify a common API between the client and server.

```javascript
var iface = {
  getUser: {
    method : 'GET',
    route  : '/user/:name',
  },
  setUser: {
    method : 'POST',
    route  : '/user/:name',
  },
  listUsers: {
    method : 'GET',
    route  : '/users',
    options: {
      limit: 10,
      order: 'desc'
    }
  }
};
```

Create an `rpc` from your interface.

```javascript
var RPC = require('lib-http-rpc')();
var rpc = RPC.NewFromInterface(iface);
```

### Server

Define your server application without any `http` dependencies.

```javascript
var solidify = require('lib-stream-solidify');
var liquify  = require('lib-stream-liquify');

function App() {
  this.users = {};
}

App.prototype.getUser = function (stream, params) {
  var name = params.name;
  var user = this.users[name];

  // this causes an HTTP 404 error
  if (!user) throw new RPC.Error(404, 'user not found');

  stream.write(JSON.stringify(user));
};

App.prototype.setUser = function (stream, params) {
  var name  = params.name;
  var users = this.users;

  // parse incoming stream as json
  solidify(stream).json(function (err, obj) {
    if (err) throw err;

    users[name] = obj;

    // send response
    stream.end();
  });
};

App.prototype.listUsers = function (stream, params) {
  var limit = params.limit;
  var order = params.order;
  var users = Object.keys(this.users);

  // sort and limit users
  users = limitBy(limit, sortBy(order, users));

  // turn user object into a stream
  liquify(users).pipe(stream);
};
```

Generate a router from your application.

```javascript
var router = rpc.getRouter(new App());
require('http').createServer(router).listen(8080);
```

### Client

Generate a client based on the shared interface.

```javascript
var client = rpc.getClient(8080, 'localhost');
var stream = client.getUser({name: 'bob'});

stream.end().pipe(process.stdout);
```
