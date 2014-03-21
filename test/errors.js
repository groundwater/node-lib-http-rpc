var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  test  : {
    method : 'GET',
    route  : '/test'
  }
};

var router = {
  test: function POST(opt, body, done) {
    done(new Error('bad request'));
  }
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(router);

var server = http.createServer(router).listen(8080, test);

function test() {
  client.test(null, null, function (err, data) {
    server.close();

    assert.notStrictEqual(err, null);
    assert.equal(data, null);

    console.log('ok');
  });
}
