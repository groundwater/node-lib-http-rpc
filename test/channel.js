var Cat     = require('concat-stream')
var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('../liquify.js');
var solidify= require('../solidify.js');
var Channel    = require('../channel.js').Channel;

test("add readable", function(t) {
  var channel = new Channel();

  channel.addReadable( liquify({b: 'B'}) );
  channel.pipe(solidify()).json(function (err, json) {
    t.iferror(err);
    t.equal(json.b, 'B');
    t.end();
  });
});

test("add readable second", function(t) {
  var channel = new Channel();

  channel.pipe(solidify()).json(function (err, json) {
    t.iferror(err);
    t.equal(json.b, 'B');
    t.end();
  });

  channel.addReadable( liquify({b: 'B'}) );
});

test("add readable late", function(t) {
  var channel = new Channel();

  channel.pipe(solidify()).json(function (err, json) {
    t.iferror(err);
    t.equal(json.b, 'B');
    t.end();
  });

  setImmediate(function() {
    channel.addReadable( liquify({b: 'B'}) );
  });
});

test("add writable", function(t) {
  var channel = new Channel();
  var solid = solidify();

  solid.json(function (err, json) {
    t.ifError(err);
    t.equal(json.b, 'B');
    t.end();
  });

  channel.addWritable( solid );

  liquify({b: 'B'}).pipe(channel);
});

test("add writable second", function(t) {
  var channel = new Channel();
  var solid = solidify();

  solid.json(function (err, json) {
    t.ifError(err);
    t.equal(json.b, 'B');
    t.end();
  });

  liquify({b: 'B'}).pipe(channel);

  channel.addWritable( solid );
});

test("add writable delayed", function(t) {
  var channel = new Channel();
  var solid = solidify();

  solid.json(function (err, json) {
    t.ifError(err);
    t.equal(json.b, 'B');
    t.end();
  });

  liquify({b: 'B'}).pipe(channel);

  setImmediate(function () {
    channel.addWritable( solid );
  });
});

test("dual stream", function (t) {
  t.plan(4);

  var channel = new Channel();
  var solid;

  channel.addReadable( liquify({b: 'B'}) );
  channel.addWritable( solid = solidify() );

  liquify({b: 'b'}).pipe(channel).pipe(solidify()).json(function (err, json) {
    t.iferror(err);
    t.equal(json.b, 'B');
  });

  solid.json(function (err, json) {
    t.iferror(err);
    t.equal(json.b, 'b');
  });
});
