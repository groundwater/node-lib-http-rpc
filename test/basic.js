var http = require('http');

var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('../liquify.js');
var solidify= require('../solidify.js');

var iface = {
  home: {
    method: 'GET',
    route: '/:name'
  }
};

var RPC = require('../index.js')();
var API = require('lib-http-api')();

var api = API.New(iface);

api.add('home', iface.home);

var rpc = RPC.NewFromAPI(api);

var router = rpc.getRouter({
  home: function(stream, params, query) {
    stream.pipe(stream);
  }
});

test("asdf", function (t) {
  t.plan(2);

  var srvr = http.createServer(router);
  var home = rpc.getClient(8080).home({name: 'bob'}, {});
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
