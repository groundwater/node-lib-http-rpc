var http   = require('http');
var Url    = require('url');
var assert = require('assert');
var util   = require('util');

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
        try {
          handler.call(handlers, opts, obj, function (err, data) {
            if (err) {
              res.statusCode = 500;

              ObjectToStream(err, res);
            } else {
              ObjectToStream(data, res);
            }
          });
        } catch (e) {
          res.statusCode = 500;
          res.end('{"code": "REMOTE_EXCEPTION"}');
        }
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

function Client(port, host) {
  this._port  = port || 80;
  this._host  = host || 'localhost';
  this._faces = {};
}

Client.prototype.add = function add(method, face) {
  this._faces[method] = face;
};

Client.prototype.format = function format(method, opts, body) {
  var out     = {};

  var face    = this._faces[method];
  var options = face.options || {};
  var route   = face.route;

  // find query arguments
  var query = [];
  Object.keys(options).forEach(function (key) {
    var opt = opts[key] ? opts[key] : options[key];
    query.push(key + '=' + opt);
    delete opts[key];
  });

  // substitute route parameters
  if (opts) Object.keys(opts).forEach(function (key) {
    var val = opts[key];
    route = route.replace(':' + key, val);
  });

  // add query args, if they exist
  if (query.length > 0) route = route + '?' + query.join('&');

  // format request options
  out.host   = this._host;
  out.port   = this._port;
  out.path   = route;
  out.method = face.method;

  return out;
};

function ErrorFromCode(code) {
  switch (code) {
  case 404:
    return {code: 'METHOD_NOT_FOUND'};
  case 500:
    return {code: 'REMOTE_EXCEPTION'};
  }
}

Client.prototype.remote = function (opts, body, callback) {
  var req = http.request(opts, onResult);

  req.on('error', function (err) {
    return callback(err);
  });

  ObjectToStream(body, req);

  function onResult(res) {
    var err = ErrorFromCode(res.statusCode);

    callback(err, res);
  }
};

function DumpToError(err, res, callback) {
  ObjectFromStream(res, function () {
    callback(err);
  });
}

function makeMethod(method, face, client) {
  var route   = face.route;
  var options = face.options || {};
  var returns = face.returns;

  client.add(method, face);

  return Handler;

  function Handler(opts, body, callback) {
    assert.equal(typeof callback, 'function');

    var out = client.format(method, opts);

    client.remote(out, body, function (err, res) {
      if (err) return DumpToError(err, res, callback);

      switch (returns) {
      case 'stream':
        callback(null, res);
        break;
      default:
        ObjectFromStream(res, callback);
      }
    });
  }
}

RPC.prototype.getClient = function (host, port) {
  var out   = {};
  var iface = this.iface;

  var client = new Client(8080, 'localhost');

  Object.keys(iface).forEach(function (method) {
    out[method] = makeMethod(method, iface[method], client);
  });

  return out;
};

module.exports = RPC;
