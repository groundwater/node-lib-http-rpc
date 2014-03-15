var http = require('http');
var url  = require('url');

var Router = require('routes-router');
var Cat    = require('concat-stream');

function ObjectFromStream(req, callback) {
  req.pipe(Cat(function (json) {
    try {
      var obj = JSON.parse(json);
      callback(null, obj);
    } catch(e) {
      callback(e, null);
    }
  }));
}

function ObjectToStream(obj, stream) {
  var x = JSON.stringify(obj);
  stream.write(x);
  stream.end();
}

function RPC(iface) {
  this.iface = iface;
}

RPC.prototype.getRouter = function (handlers) {
  var iface  = this.iface;

  var routes = {};
  var router = Router();

  Object.keys(iface).forEach(function (name) {
    var method  = iface[name].method;
    var route   = iface[name].route;

    var handler = handlers[name];

    function handle(req, res) {
      ObjectFromStream(req, function (err, obj) {
        handler(null, obj, function (err, data) {
          ObjectToStream(data, res);
        });
      });
    };

    if (!routes[route]) routes[route] = {};

    routes[route][method] = handle;
  });

  Object.keys(routes).forEach(function (name){
    router.addRoute(name, routes[name]);
  });

  return router;
};

RPC.prototype.getClient = function (host, port) {
  var out   = {};
  var iface = this.iface;

  Object.keys(this.iface).forEach(function (method) {
    var route = this.iface[method].route;
    out[method] = function (opts, body, callback) {
      var opts = {
        host   : host,
        port   : port,
        path   : route,
        method : iface[method].method
      };
      var req = http.request(opts, function (res) {
        var buf = [];
        res.on('data', function (chunk) {
          buf.push(chunk);
        });
        res.on('end', function () {
          var json;
          try {
            json = JSON.parse(buf.join(''));
          } catch(e) {
            json = null;
          }
          callback(null, json);
        });
      })
      if (body) req.write(JSON.stringify(body));
      req.end();
    }
  }, this);

  return out;
};

module.exports = RPC;
