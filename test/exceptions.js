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

test("catch NotFoundError errors as 404 errors", function (t) {
  var router = rpc.getRouter({
    home: function(stream, params, query) {
      throw new RPC.NotFoundError();
    }
  });
  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home();

  srvr.listen(8080);

  home.end().on('error', function (err, res) {
    solidify(res);

    t.ok(err);
    t.equal(err.code, 404);

    srvr.close();
    t.end();
  });
});

test("catch NotFoundError errors as 404 errors", function (t) {
  var router = rpc.getRouter({
    home: function(stream, params, query) {
      throw new RPC.BadRequestError();
    }
  });
  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home();

  srvr.listen(8080);

  home.end().on('error', function (err, res) {
    solidify(res);

    t.ok(err);
    t.equal(err.code, 400);

    srvr.close();
    t.end();
  });
});
