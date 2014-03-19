var assert = require('assert');
var stream = require('stream');
var http   = require('http');

var RPC    = require('../index.js');

var iface  = {
  test: {
    method : 'GET',
    route  : '/test',
  }
};

var routes = {
  name: 'bob',
  test: function (opts, body, done) {
    assert.equal(this.name, 'bob');
    done(null);
  }
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(routes);

var server = http.createServer(router).listen(8080);

client.test(null, null, function (err, data) {
  server.close();
  
  assert.ifError(err);
  console.log('ok')
});
