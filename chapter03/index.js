var express = require('express');

var app = express();

// handlebar view engine config
var handlebars = require('express-handlebars')
  .create({defaultLayout:'main'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
  // res.type('text/plain');
  // res.send('home');
  res.render('home');
});

app.get('/about', function(req, res){
  // res.type('text/plain');
  // res.send('about');
  res.render('about');
});

app.use(function(req, res){
  // res.type('text/plain');
  res.status(404);
  // res.send('404 - Not Found');
  res.render('404');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  // res.type('text/plain');
  res.status(500);
  // res.send('500 - Server Error');
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') +
   '; press Ctrl + C to terminate.');
});
