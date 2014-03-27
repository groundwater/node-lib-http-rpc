var Cat = require('concat-stream');
var liquify = require('../liquify');
var test = require('tap').test;

test("liquify basic object", function (t) {
  liquify({a: 'A'}).pipe(Cat(function(done){
    t.equal(done.toString(), '{"a":"A"}');
    t.end();
  }));
})

test("can liquify null", function (t) {
  liquify(null).pipe(Cat(function(done){
    t.equal(done.toString(), 'null');
    t.end();
  }));
})

test("can liquify undefined", function (t) {
  liquify().pipe(Cat(function(done){
    t.equal(done.toString(), '');
    t.end();
  }));
})

test("can liquify number", function (t) {
  liquify(12).pipe(Cat(function(done){
    t.equal(done.toString(), '12');
    t.end();
  }));
})

test("can liquify string", function (t) {
  liquify("hello world").pipe(Cat(function(done){
    t.equal(done.toString(), '"hello world"');
    t.end();
  }));
})
