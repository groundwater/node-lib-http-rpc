# http rpc

## Install

```
npm install --save lib-http-rpc
```

## Usage

### Common

```javascript
var RPC = require('lib-http-rpc');

var api = {
  getUser: {
    method : 'GET',
    route  : '/user'
  }
};

var rpc = new RPC(iface);
```

### Server

```javascript
var handlers = {
  getUser : function (opts, body, done) {
    if (!opts.name) done(new Error('Please Specify a name'))
    else            done(null, {name: 'bob', age: 12});
  }
};

var router = rpc.getRouter(handlers);
require('http').createServer(router).listen(8080);
```

### Client

```javascript
var client = rpc.createClient('localhost', 8080);

client.getUser({name: 'bob'}, null, function (err, user) {
  if (err) console.log('Error', err);
  else     console.log('Got User', user);
});
```
