var assert = require('assert');
var stream = require('stream');
var http   = require('http');

var RPC    = require('../index.js');

var iface  = {
  test : {
    method  : 'GET',
    route   : '/test',
    accepts : 'stream',
    returns : 'stream'
  },
  testAccepts: {
    method : 'GET',
    route  : '/test/accepts',
    accepts: 'stream'
  },
  testReturns: {
    method : 'GET',
    route  : '/test/returns',
    returns: 'stream'
  }
};

var routes = {
  test: function (opts, body, done) {
    assert(body instanceof stream.Readable);
    done(null);
  },
  testAccepts: function (opts, body, done) {
    assert(body instanceof stream.Readable);
    done(null, {a: true});
  },
  testReturns: function (opts, body, done) {
    done();
  }
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(routes);

var server = http.createServer(router).listen(8080);

client.test(null, null, function (err, data) {
  assert(data instanceof stream.Readable);
  data.pipe(process.stdout);
  client.testAccepts(null, null, function (err, data) {
    assert(data.a);
    client.testReturns(null, null, function (err, data) {
      assert(data instanceof stream.Readable);
      data.pipe(process.stdout);
      server.close();
      console.log('ok');
    })
  });
});
