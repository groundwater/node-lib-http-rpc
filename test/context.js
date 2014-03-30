var http = require('http');

var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('lib-stream-liquify');
var solidify= require('lib-stream-solidify');

var iface = {
  home: {
    method: 'GET',
    route: '/'
  }
};

var RPC = require('../index.js')();
var rpc = RPC.NewFromInterface(iface);

test("a context", function (t) {
  var router = rpc.getRouter({
    home: function(stream, params, context) {
      t.ok(context, 'should be provided');
      t.equal(typeof context, 'object', 'should be an object');

      stream.end();
    }
  });

  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home();
  var done = solidify();

  srvr.listen(8080);

  home.end().pipe(done).json(function (err, json) {
    srvr.close();
    t.end();
  });
});

test("context properties", function (t) {
  var router = rpc.getRouter({
    home: function(stream, params, context) {
      var key = 'key';
      var val = 'val';

      context.set(key, val);

      var res = context.get(key);

      t.equal(res, val, 'context should get/set values');

      stream.end();
    }
  });

  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home();
  var done = solidify();

  srvr.listen(8080);

  home.end().pipe(done).json(function (err, json) {
    srvr.close();
    t.end();
  });
});
