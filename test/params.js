var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  test : {
    method : 'GET',
    route  : '/test/:id'
  }
};

var routes = {
  test: function (opt, body, done) {
    assert.equal(opt.id, 'bob');
    done(null, 'okay');
  }
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(routes);

var server = http.createServer(router).listen(8080);

client.test({id: 'bob'}, null, function (err, data) {
  server.close();

  assert.ifError(err);
  assert.equal(data, 'okay');

  console.log('okay');
});
