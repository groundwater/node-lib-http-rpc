var http = require('http');
var domain  = require('domain');
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

var router = rpc.getRouter({
  home: function(stream, params, context) {
    stream.end();
    throw new Error();
  }
});

test("happy path", function (t) {
  t.plan(1);

  var d = domain.create();

  d.once('error', function(e){
    t.ok(e);
  });

  d.run(function() {
    var srvr = http.createServer(router);
    var home = rpc.getClient(8080).home({name: 'bob'});

    srvr.listen(8080);

    solidify(home.end()).json(function (err, json) {
      srvr.close();
    });
  })
});
