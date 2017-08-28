var express = require('express');

var app = express();

app.get('/about', function(req, res){
  res.render('about');
});

app.get('/error', function(req, res){
  // res.status(500);
  // res.render('error');

  res.status(500).render('error');
});

app.get('/greeting', function(req, res){
  res.render('about', {
    message: 'welcome',
    style: req.query.style,
    userid: req.cookie.userid,
    username: req.session.username,
  });
});

app.get('/no-layout', function(req, res){
  res.render('no-layout', {layout: null});
});

// use 'views/layouts/custom.handlebars'
app.get('/custom-layout', function(req, req){
  res.render('custom-layout', {layout: 'custom'})
});

app.get('/test', function(req, res){
  res.type('text/plain');
  res.send('this is a test');
});

// error handler
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).render('error');
});

app.use(function(req, res){
  res.status(400).render('not-found');
});
