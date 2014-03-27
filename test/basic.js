var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('../liquify.js');
var solidify= require('../solidify.js');

var ifac = {
  home: {
    method: 'GET',
    route: '/'
  }
};

var RPC = require('../index.js')();
var rpc = RPC.NewFromInterface(ifac);

test("home", function(t){
  var client = rpc.getClient(8080, 'localhost');
  t.ok(client, "should return a client");
  t.equal(typeof client, 'object', 'should be an object');
  t.equal(typeof client.home, 'function', 'should have a home method');
  t.end();
});

test("home method", function(t){
  t.plan(5);

  var client = rpc.getClient(8080, 'localhost');

  var socket;

  socket = client.home();
  t.equal(typeof socket._write, 'function', "returns a writable stream");

  liquify({a: 'A'}).pipe(socket).pipe(solidify()).json(function (err, obj){
    t.ifError(err);
    t.equal(obj.a, 'A', 'object should get piped through');
  });

  socket = client.home();
  liquify({a: 'a'}).pipe(socket).pipe(solidify()).json(function (err, obj){
    t.ifError(err);
    t.equal(obj.a, 'a', 'object should get piped through');
  });

});
