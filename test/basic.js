var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  getUser : {
    method : 'GET',
    route  : '/user'
  },
  eatUser : {
    route: '/eat',
    method: 'GET'
  }
};

function Router(){}

Router.prototype.getUser = function (opt, body, done) {
  done(null, 'okay');
};

Router.prototype.eatUser = function (opt, body, done) {
  done(null, 'noway');
}

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(new Router());

http.createServer(router).listen(8080);

client.getUser({id: 'bob'}, null, function (err, data) {
  assert(!err);
  assert.equal(data, 'okay');
  client.eatUser(null, null, function (err, data) {
    assert(!err);
    assert.equal(data, 'noway');
    console.log('ok');
    process.exit(0);
  });
});
