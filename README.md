# http rpc

> rpc over http using streams

[![Build Status](https://travis-ci.org/groundwater/node-lib-http-rpc.png?branch=master)](https://travis-ci.org/groundwater/node-lib-http-rpc)
[![NPM version](https://badge.fury.io/js/lib-http-rpc.png)](http://badge.fury.io/js/lib-http-rpc)

Build *both* the client and server from a common interface.

## Install

```
npm install --save lib-http-rpc
```

## Usage

### Common

Specify a common API between the client and server.

```javascript
var RPC = require('lib-http-rpc')();

var iface = {
  echo: {
    method : 'GET',
    route  : '/echo'
  }
};

var rpc = RPC.NewFromInterface(iface);
```

### Server

Generate a router based on the shared interface.

```javascript
// create handlers for each method in the API
var handlers = {
  echo : function (stream, params, query) {

    // the readable end of the stream is your http request body
    // the writable end of the stream is your http response body
    //
    // we echo the request into the response
    // the client will receive exactly what they send
    stream.pipe(stream);
  }
};

// generate a router that calls each handler, based on the route
var router = rpc.getRouter(handlers);
require('http').createServer(router).listen(8080);
```

### Client

Generate a client based on the shared interface.

```javascript
var client = rpc.createClient(8080, 'localhost');
var stream = client.echo();

// the writable end of the stream represents your http request body
stream.pipe(process.stdout);

// the readable end of the stream represents your http response body
stream.write('HELLO WORLD');
stream.end();
```

This should print `HELLO WORLD` when run from the terminal.
