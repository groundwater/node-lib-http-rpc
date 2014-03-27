var Cat = require('concat-stream');
var solidify = require('../solidify');
var test = require('tap').test;

test("solidify basic json", function (t) {
  var x = solidify();

  x.json(function(err, json) {
    t.ifError(err);
    t.deepEqual(json, {a: 'A'});
    t.end();
  });

  x.end('{"a":"A"}');
});

test("solidify number", function (t) {
  var x = solidify();

  x.json(function(err, json) {
    t.ifError(err);
    t.strictEqual(json, 123);
    t.end();
  });

  x.end('123');
});

test("solidify string", function (t) {
  var x = solidify();

  x.json(function(err, json) {
    t.ifError(err);
    t.strictEqual(json, "123");
    t.end();
  });

  x.end('"123"');
});

test("solidify error", function (t) {
  var x = solidify();

  x.json(function(err, json) {
    t.ifError(json);
    t.ok(err);
    t.end();
  });

  x.end('{"a"');
});

test("solidify empty", function (t) {
  var x = solidify();

  x.json(function(err, json) {
    t.ifError(json);
    t.ok(err);
    t.end();
  });

  x.end();
});
