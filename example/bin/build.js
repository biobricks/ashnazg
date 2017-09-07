#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var browserify = require('browserify');

function build(opts) {
  opts = opts || {};

  var output = path.join(__dirname, '..', 'bundle.js');

  function onBuildEnd(msg) {
    console.log("Completed" + ((msg) ? (': ' + msg) : ''));
  }

  function onBuildStart() {

    console.log("Build started...");

    var outStream = fs.createWriteStream(output);

    outStream.on('close', onBuildEnd);

    b.bundle()

      .on('error', function(err) {
        if(err instanceof SyntaxError) {
          // Format syntax error messages nicely
          var re = new RegExp(err.filename+'\:? ?');
          var msg = err.message.replace(re, '');
          msg = msg.replace(/ while parsing file\:.*/, '');
          console.error();
          console.error("\nError: " + msg.underline);
          console.error();
          console.error("Filename:", err.filename);
          console.error();
          console.error(err.loc);
          console.error();
          console.error(err.codeFrame);
          console.error();
        } else {
          console.error(err);
        }
      })
    
      .pipe(outStream);
  }

  var b = browserify({
    entries: [path.join(__dirname, '..', 'index.js')]
  })


  b.on('update', function(time) {
    onBuildStart();  
  });


  b.transform('babelify', {
    presets: [
      'es2015'
    ],
    plugins: [
      ['transform-react-jsx', {pragma: 'h'}]
    ]
  })

  onBuildStart();
}

build();
