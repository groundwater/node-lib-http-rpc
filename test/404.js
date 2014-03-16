var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  test : {
    method : 'GET',
    route  : '/test'
  }
};

var routes = {};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(routes);

var server = http.createServer(router).listen(8080);

client.test(null, null, function (err, data) {
  server.close();

  assert.equal(err.code, 'METHOD_NOT_FOUND');

  console.log('okay');
});
