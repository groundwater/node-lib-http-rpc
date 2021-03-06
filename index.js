'use strict';

var util   = require('util');
var domain = require('domain');

/*

  Data Structures

*/

// a context provides all dynamic and pluggable properties of the rpc request
function Context() {
  this._props = {};
}

function RPC($) {
  this.$     = $;
  this.api   = null;
  this.iface = null;
}

/*

  Public Methods

*/

RPC.prototype.getRouter = function getRouter(handlers) {
  var rpc = this;

  return rpc.$.router.bind(null, rpc, handlers);
};

RPC.prototype.getClient = function getClient(port, host) {
  var self   = this;
  var $      = this.$;
  var api    = this.api;
  var iface  = this.iface;

  // create http bridge for RPC
  var requestor = $.Requestor.NewFromServer(port, host);

  // add RPC methods to client
  var client = {};
  Object.keys(iface).forEach(function (key) {
    client[key] = goGet.bind(iface[key], api, key, requestor);
  });

  return client;
};


Context.prototype.get = function get(property) {
  return this._props[property];
};

Context.prototype.set = function set(property, content) {
  this._props[property] = content;
};

/*

  Exceptions

*/

RPC.Error = function RpcError(code, message) {
  Error.call(this, message);

  this.statusCode = code;
};
util.inherits(RPC.Error, Error);

RPC.NotFoundError = function NotFoundError() {
  Error.apply(this, arguments);

  this.statusCode = 404;
};
util.inherits(RPC.NotFoundError, RPC.Error);

RPC.BadRequestError = function BadRequestError() {
  Error.apply(this, arguments);

  this.statusCode = 400;
};
util.inherits(RPC.BadRequestError, RPC.Error);

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

// bound method that accepts a `params` object and returns a duplex stream
function goGet(api, key, requestor, params) {
  /*jshint validthis: true */

  var query  = {};
  var opt;

  // extract query options
  for (opt in this.options) {
    query[opt] = this.options[opt];
  }

  // unexpected params are ignored,
  // so we don't need to filter the query options from the params object
  var opts   = api.request(key, params, query);
  var duplex = requestor.newDuplex(opts);

  return duplex;
}

// fill api from interface
function populateApiFromInterface(api, iface) {
  Object.keys(iface).forEach(function (key) {
    api.add(key, iface[key]);
  });
}

// make http router
// use Function.bind to create a router given an rpc, and set of handlers
function router(rpc, handlers, req, res) {
  var $       = rpc.$;
  var api     = rpc.api;
  var request = api.handle(req.method, req.url);
  var dom     = domain.create();

  // the request handler doesn't exit
  // TODO: hoist response logic
  if (!request) {
    res.statusCode = 404;
    res.end();
    return;
  }

  var context = new Context(); // TODO: hoist to own module
  var handle  = request.handle;
  var params  = {};

  // TODO: hoist logic to 'union' module
  var key;
  for(key in request.params) params[key] = request.params[key];
  for(key in request.query)  params[key] = request.query[key];

  var future = $.future();

  future.setWritable(res);
  future.setReadable(req);

  // TODO: extract request making logic
  res.setHeader('Transfer-Encoding' , 'chunked');
  res.setHeader('Content-Type'      , 'application/json');

  dom.on('error', function (err) {
    var statusCode = err.statusCode;

    // only catch known errors, re-throw unexpected errors
    if (!statusCode) throw err;

    // TODO: hoist response logic
    res.statusCode = statusCode;
    res.write(JSON.stringify(err));
    res.end();
  });

  // domain should handle all route errors
  dom.run(function () {
    handlers[handle](future, params, context);
  });
}

/*

  Dependency Injection

*/

function inject(deps) {
  return Object.create(RPC, deps);
}

function defaults() {
  return {

    // dependency injections
    
    Requestor : {
      value: require('lib-stream-http')()
    },
    future: {
      value: require('lib-stream-future')
    },
    API : {
      value: require('lib-http-api')()
    },

    // private method injections

    populateApiFromInterface: {
      value: populateApiFromInterface
    },
    router: {
      value: router
    },
  };
}

module.exports = function INIT(deps) {
  return inject(deps || defaults());
};
