var http   = require('http');
var Url    = require('url');
var assert = require('assert');

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
      var url = Url.parse(req.url, true);
      Object.keys(url.query).forEach(function (key) {
        opts[key] = url.query[key];
      });

      // if there is no handler, return a 404
      if (!handler) {
        res.statusCode = 404;
        res.end();

        return;
      }

      var type = iface[name].accepts || 'object';

      if (type === 'stream') {
        go(null, req);
      } else {
        ObjectFromStream(req, go);
      }

      function go(err, obj) {
        handler(opts, obj, function (err, data) {
          if (err) {
            res.statusCode = 500;

            ObjectToStream(err, res);
          } else {
            ObjectToStream(data, res);
          }
        });
      }

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
    var route   = iface[method].route;
    var options = iface[method].options || {};

    out[method] = function (opts, body, callback) {
      assert.equal(typeof callback, 'function');

      var query = [];
      Object.keys(options).forEach(function (key) {
        var opt = opts[key] ? opts[key] : options[key];
        query.push(key + '=' + opt);
        delete opts[key];
      });

      if (opts) Object.keys(opts).forEach(function (key) {
        var val = opts[key];
        route = route.replace(':' + key, val);
      });

      route = route + '?' + query.join('&');

      var req_opts = {
        host   : host,
        port   : port,
        path   : route,
        method : iface[method].method
      };

      var returns = iface[method].returns || 'object';

      function onResponse(res) {
        var code  = res.statusCode;
        var isErr = code >= 400;

        function go(err, obj) {
          if (err)           callback(err, obj);
          else if (isErr) {
            if (code == 404) callback({code: 'METHOD_NOT_FOUND'});
            else             callback(obj, null);
          }
          else               callback(null, obj);
        }

        if (returns == 'stream')
          go(null, res);
        else
          ObjectFromStream(res, go);

      }

      ObjectToStream(body, http.request(req_opts, onResponse));
    }
  });

  return out;
};

module.exports = RPC;
