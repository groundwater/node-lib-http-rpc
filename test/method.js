var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  testGET  : {
    method : 'GET',
    route  : '/test'
  },
  testPOST : {
    method : 'POST',
    route  : '/test'
  }
};

function Router(){}

Router.prototype.testGET = function GET(opt, body, done) {
  done(null, 'GET');
};

Router.prototype.testPOST = function POST(opt, body, done) {
  done(null, 'POST');
}

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(new Router());

http.createServer(router).listen(8080);

client.testGET(null, null, function (err, data) {
  assert(!err);
  assert.equal(data, 'GET');
  client.testPOST(null, null, function (err, data) {
    assert(!err);
    assert.equal(data, 'POST');
    console.log('ok');
    process.exit(0);
  });
});
