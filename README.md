# http rpc

[![Build Status](https://travis-ci.org/groundwater/node-lib-http-rpc.png?branch=master)](https://travis-ci.org/groundwater/node-lib-http-rpc)
[![NPM version](https://badge.fury.io/js/lib-http-rpc.png)](http://badge.fury.io/js/lib-http-rpc)

## Install

```
npm install --save lib-http-rpc
```

## Usage

### Common

Specify a common API between the client and server.

```javascript
var RPC = require('lib-http-rpc');

var api = {
  getUser: {
    method : 'GET',
    route  : '/user/:name'
  }
};

var rpc = new RPC(iface);
```

### Server

Generate a router based on the shared interface.

```javascript
// create handlers for each method in the API
var handlers = {
  getUser : function (opts, body, done) {
    if (!opts.name) done(new Error('Please Specify a name'))
    else            done(null, 'bob');
  }
};

// generate a router that calls each handler, based on the route
var router = rpc.getRouter(handlers);
require('http').createServer(router).listen(8080);
```

### Client

Generate a client based on the shared interface.

```javascript
var client = rpc.createClient('localhost', 8080);

client.getUser({name: 'bob'}, null, function (err, user) {
  if (err) console.log('Error', err);
  else     console.log('Got User', user);
});
```

## Advanced

### http query string

```javascript
var api = {
  findUser: {
    method: 'GET',
    route: '/users/:query',
    options: {
      limit: 100,
      order: 'desc'
    }
  }
};
```

*client*

```javascript
client.findUser({query: 'joe', limit: 200}, null, function (err, res){
  console.log('Found', res);
})
```

This will generate the url:

```
http://SERVER/users/joe?limit=200
```

The server will receive the default options always.
