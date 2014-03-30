var http = require('http');

var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('lib-stream-liquify');
var solidify= require('lib-stream-solidify');

var iface = {
  home: {
    method: 'GET',
    route: '/:name'
  }
};

var RPC = require('../index.js')();
var rpc = RPC.NewFromInterface(iface);

test("a context", function (t) {
  t.plan(2);

  var router = rpc.getRouter({
    home: function(stream, params, context) {
      t.ok(context, 'should be provided');
      t.equal(typeof context, 'object', 'should be an object');

      stream.end();
    }
  });

  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'});
  var done = solidify();
  var body = {};

  srvr.listen(8080);

  liquify(body).pipe(home).pipe(done).json(function (err, json) {
    srvr.close();
  });
});
