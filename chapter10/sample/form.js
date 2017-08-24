var express = require('express');

var app = express();

// need to body-parser middleware
app.post('/process-contact', function(req, res){
  console.log('Received contact from ' + req.body.name +
  ' <' + req.body.email + '>');

  // insert database
  res.redirect(303, '/thank-you');
});

app.post('/process-contact', function(req, res){
  console.log('Received contact from ' + req.body.name +
  ' <' + req.body.email + '>');
  try {
    // insert database
    return res.xhr ?
      res.render({ success: true});
      res.redirect(303, '/thank-you');
  } catch (e) {
    return res.xhr ?
      res.json({error: 'Database error'});
      res.redirect(303, '/database-error');
  } finally {

  }
});
