"use strict";

var util = require('util');
var domain = require('domain');

function RPC($) {
  this.$ = $;
  this.api = null;
  this.iface = null;
}

RPC.Error = function RpcError(code, message) {
  Error.call(this, message);

  this.statusCode = code;
};
util.inherits(RPC.Error, Error);

RPC.prototype.getRouter = function getRouter(handlers) {
  var $ = this.$;
  var api = this.api;

  return router;

  function router(req, res) {
    var request = api.handle(req.method, req.url);
    var dom = domain.create();

    dom.on('error', function (err) {
      var statusCode = err.statusCode || 500;
      res.statusCode = statusCode;
      res.write(JSON.stringify(err));
      res.end();
    });

    if (!request) {
      res.statusCode = 404;
      res.end();
      return;
    }

    var handle = request.handle;
    var params = request.params;
    var query  = request.query;

    var future = $.future();

    future.setWritable(res);
    future.setReadable(req);

    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader("Content-Type", "application/json");

    dom.run(function () {
      handlers[handle](future, params, query);
    });
  }
};

RPC.prototype.getClient = function getClient(port, host) {
  var $ = this.$;
  var api = this.api;

  var client = {};

  Object.keys(this.iface).forEach(function (key) {
    client[key] = function (params, query) {
      var opts = api.request(key, params, query);

      opts.host = host;
      opts.port = port;
      opts.headers = {
        "Transfer-Encoding": "chunked",
        "Content-Type": "application/json",
      };

      var req = $.NewRequest(opts);

      return req;
    };
  });

  return client;
};

RPC.New = function NewRPC() {
  return new RPC(this);
};

function populateApiFromInterface(api, iface) {
  Object.keys(iface).forEach(function (key) {
    api.add(key, iface[key]);
  });
}

RPC.NewFromInterface = function NewFromInterface(iface) {
  var rpc = this.New();
  var api = this.API.New();

  rpc.api = api;
  rpc.iface = iface;

  this.populateApiFromInterface(api, iface);

  return rpc;
};

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var deps = {
    NewRequest : {
      value: require('./request.js')
    },
    future: {
      value: require('lib-stream-future')
    },
    API : {
      value: require('lib-http-api')()
    },
    populateApiFromInterface: {
      value: populateApiFromInterface
    }
  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
