#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var net = require('net');
var http = require('http');
var ecstatic = require('ecstatic')
var router = require('routes')(); // server side router

var staticFiles = ecstatic({
  root: path.join(__dirname, '..'),
  baseDir: '',
  gzip: true,
  cache: 0
});

router.addRoute('/*', function(req, res, match) {
  return staticFiles(req, res);
});


var server = http.createServer(function (req, res) {
  var m = router.match(req.url);
  m.fn(req, res, m);
});

// start the webserver
console.log("Starting http server on locahost port 8000");
server.listen(8000, 'localhost');
