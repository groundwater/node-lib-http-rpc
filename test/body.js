var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  push : {
    method : 'POST',
    route  : '/'
  }
};

function Router(){}

Router.prototype.push = function (opt, body, done) {
  done(null, body);
};

var rpc = new RPC(iface);

var client = rpc.getClient('localhost', 8080);
var router = rpc.getRouter(new Router());

http.createServer(router).listen(8080);

var body = {
  name: "bob"
}
client.push({id: 'bob'}, body, function (err, data) {
  assert(!err);
  assert.equal(data.name, 'bob');
  console.log('ok');
  process.exit(0);
});
