var stream = require('stream');
var http   = require('http');

var test   = require('tap').test;

var RPC    = require('../index.js');

var iface  = {
  test: {
    method : 'GET',
    route  : '/test',
  }
};

var routes = {
  test: function (opts, body, done) {
    throw new Error();
  }
};

test("throwing should return a 500", function (t) {
  t.plan(1);

  var rpc = new RPC(iface);

  var client = rpc.getClient('localhost', 8080);
  var router = rpc.getRouter(routes);

  var server = http.createServer(router).listen(8080);

  client.test(null, null, function (err, data) {
    server.close();

    t.equal(err.code, "REMOTE_EXCEPTION");
  });
});
