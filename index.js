var http = require('http');
var url  = require('url');

var Router = require('routes-router');
var Cat    = require('concat-stream');

function ObjectFromStream(req, callback) {
  req.pipe(Cat({encoding: 'string'}, function (json) {

    if (!json) return callback(null, null);

    var obj, err;
    try {
      obj = JSON.parse(json);
    } catch(e) {
      err = e;
    }

    callback(err, obj);
  }));
}

function ObjectToStream(obj, stream) {
  if (obj)
    stream.write(JSON.stringify(obj));
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

    function handle(req, res, opts) {
      ObjectFromStream(req, function (err, obj) {
        handler(opts, obj, function (err, data) {
          if (err) {
            res.statusCode = 500;

            ObjectToStream(err, res);
          } else {
            ObjectToStream(data, res);
          }
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
    var route = iface[method].route;
    out[method] = function (opts, body, callback) {

      if (opts) Object.keys(opts).forEach(function (key) {
        var val = opts[key];
        route = route.replace(':' + key, val);
      });
      
      var opts = {
        host   : host,
        port   : port,
        path   : route,
        method : iface[method].method
      };

      function onResponse(res) {
        var isErr = res.statusCode >= 400;
        ObjectFromStream(res, function (err, obj) {
          if (err)        callback(err, obj);
          else if (isErr) callback(obj, null);
          else            callback(null, obj);
        });
      }

      ObjectToStream(body, http.request(opts, onResponse));
    }
  });

  return out;
};

module.exports = RPC;
