'use strict';

var util   = require('util');
var domain = require('domain');

/*

  Type and Methods

*/

function RPC($) {
  this.$     = $;
  this.api   = null;
  this.iface = null;
}

RPC.prototype.getRouter = function getRouter(handlers) {
  var rpc = this;

  return boundRouter;

  function boundRouter(req, res) {
    return rpc.$.router(rpc, handlers, req, res);
  }
};

RPC.prototype.getClient = function getClient(port, host) {
  var self   = this;
  var $      = this.$;
  var api    = this.api;

  var rqstor = $.Requestor.NewFromServer(port, host);
  var client = {};

  Object.keys(this.iface).forEach(function (key) {
    client[key] = goGet.bind(null, api, key, rqstor);
  });

  return client;
};

function goGet(api, key, rqstor, params, query) {
  var opts   = api.request(key, params, query);
  var duplex = rqstor.newDuplex(opts);

  return duplex;
}

/*

  Exceptions

*/

RPC.Error = function RpcError(code, message) {
  Error.call(this, message);

  this.statusCode = code;
};
util.inherits(RPC.Error, Error);

/*

  Constructors

*/

RPC.New = function NewRPC() {
  return new RPC(this);
};

RPC.NewFromInterface = function NewFromInterface(iface) {
  var rpc = this.New();
  var api = this.API.New();

  rpc.api = api;
  rpc.iface = iface;

  this.populateApiFromInterface(api, iface);

  return rpc;
};

/*

  Private Functions

*/

function router(rpc, handlers, req, res) {
  var $       = rpc.$;
  var api     = rpc.api;
  var request = api.handle(req.method, req.url);
  var dom     = domain.create();

  // the request handler doesn't exit
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

  res.setHeader('Transfer-Encoding' , 'chunked');
  res.setHeader('Content-Type'      , 'application/json');

  dom.on('error', function (err) {
    var statusCode = err.statusCode || 500;
    res.statusCode = statusCode;
    res.write(JSON.stringify(err));
    res.end();
  });

  dom.run(function () {
    handlers[handle](future, params, query);
  });
}

function populateApiFromInterface(api, iface) {
  Object.keys(iface).forEach(function (key) {
    api.add(key, iface[key]);
  });
}

/*

  Dependency Injection

*/

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  var deps = {
    Requestor : {
      value: require('lib-stream-http')()
    },
    future: {
      value: require('lib-stream-future')
    },
    API : {
      value: require('lib-http-api')()
    },
    populateApiFromInterface: {
      value: populateApiFromInterface
    },
    router: {
      value: router
    },
  };
  return inject(deps);
}

module.exports = function INIT(deps) {
  if (typeof deps === 'object') return inject(deps);
  else if (deps === undefined)  return defaults();
  else                          throw new Error('injection error');
};
