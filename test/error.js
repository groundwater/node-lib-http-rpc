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

test("catch throws as 500 errors", function (t) {
  t.plan(4);


  var router = rpc.getRouter({
    home: function(stream, params, query) {
      throw new RPC.Error(500);
    }
  });
  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'}, {});

  srvr.listen(8080);

  home.end().on('error', function (err, res) {
    solidify(res).text(function (err, data) {
      t.ifError(err);
      t.ok(data);
    });
    t.ok(err);
    t.equal(err.code, 500);
    srvr.close();
  });
});

test("catch 404 throws as 404 errors", function (t) {
  t.plan(4);

  var router = rpc.getRouter({
    home: function(stream, params, query) {
      throw new RPC.Error(404);
    }
  });
  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'}, {});

  srvr.listen(8080);

  home.end().on('error', function (err, res) {
    solidify(res).text(function (err, data) {
      t.ifError(err);
      t.ok(data);
    });
    t.ok(err);
    t.equal(err.code, 404);
    srvr.close();
  });
});

test("catch async errors", function (t) {
  t.plan(4);

  var router = rpc.getRouter({
    home: function(stream, params, query) {
      setImmediate(function () {
        throw new RPC.Error(400);
      });
    }
  });
  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'}, {});

  srvr.listen(8080);

  home.end().on('error', function (err, res) {
    solidify(res).text(function (err, data) {
      t.ifError(err);
      t.ok(data);
    });
    t.ok(err);
    t.equal(err.code, 400);
    srvr.close();
  });
});
