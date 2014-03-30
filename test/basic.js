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

var router = rpc.getRouter({
  home: function(stream, params, context) {
    stream.pipe(stream);
  }
});

test("happy path", function (t) {
  t.plan(2);

  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'});
  var done = solidify();
  var body = {
    name       : 'Kim Berley',
    location   : 'San Francisco',
    occupation : 'Software Nerd',
  };

  srvr.listen(8080);

  liquify(body).pipe(home).pipe(done).json(function (err, json) {
    t.ifError(err);
    t.deepEqual(json, body);
    srvr.close();
  });
});
