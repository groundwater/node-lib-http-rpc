var http   = require('http');
var assert = require('assert');

var RPC    = require('../index.js');

var iface  = {
  echo : {
    method : 'POST',
    route  : '/'
  }
};

var rpc = new RPC(iface);
var client = rpc.getClient('localhost', 8080);

assert.throws(function () {
  // must specify a callback function
  client.echo();
});
