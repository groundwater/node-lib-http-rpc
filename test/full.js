var http = require('http');

var stream  = require('stream');
var test    = require('tap').test;
var liquify = require('lib-stream-liquify');
var solidify= require('lib-stream-solidify');

var iface = {
  user: {
    method: 'GET',
    route: '/user/:name'
  },
  list: {
    method: 'GET',
    route: '/users',
    options: {
      sort: 'desc',
      limit: 100
    }
  }
};

var RPC = require('../index.js')();
var rpc = RPC.NewFromInterface(iface);

var users = {
  bob: {
    name: 'Bob Smitherston'
  },
  kim: {
    name: 'Kim Kimberly'
  },
}
var router = rpc.getRouter({
  user: function (stream, params, query) {
    liquify(users[params.name]).pipe(stream);
  },
  list: function (stream, params, query) {
    var keys  = Object.keys(users);
    var sort  = query.sort;
    var limit = query.limit;

    switch (sort) {
    case 'asc':
      keys.sort();
      break;
    case 'desc':
      keys.reverse();
      break;
    }

    if (keys.length > limit) keys = keys.slice(0, limit);

    liquify(keys).pipe(stream);
  },
});

var client = rpc.getClient(8080);
var server = http.createServer(router);
server.listen(8080);

var list = client.list({}, {limit: 1, sort: 'desc'});

test(function (t) {
  list.end().pipe(solidify()).json(function (err, json) {
    var name = json[0];
    var get = client.user({name: name});
    get.end().pipe(solidify()).json(function (err, json) {
      t.equal(json.name, 'Kim Kimberly');
      t.end();
      server.close();
    });
  });
})
