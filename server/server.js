var express = require('express'),
body_parser = require('body-parser'),
path = require('path'),
app = express(),
fs = require('fs');
app.listen(8000);

app.use(express.static(path.join(__dirname, '../build')));

app.get('/', function(req, res) {
  res.sendFile(path.join(__dirname, '../examples', 'example.html'));
});
app.post('/upload', body_parser(), function(req, res) {
  var data = [];

  res.on('data', function(chunk) {
      data.push(chunk);
  }).on('end', function() {
      var buffer = new Buffer(data.reduce(function(prev, current) {
        return prev.concat(Array.prototype.slice.call(current));
      }, []);
      console.log(buffer.toString('base64'));
  });
});
