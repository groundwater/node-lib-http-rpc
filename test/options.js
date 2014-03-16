var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  test : {
    method : 'GET',
    route  : '/test',
    options: {
      a: 'A',
      b: 'B'
    }
  }
};

var routes = {
  test: function (opts, body, done) {
    assert.equal(opts.a, 'A');
    assert.equal(opts.b, 'C');
    done(null);
  }
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(routes);

var server = http.createServer(router).listen(8080);

client.test({a: 'A', b: 'C'}, null, function (err, data) {
  server.close();

  console.log('okay');
});
