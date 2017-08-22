var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var credentials = require('./credentials.js');

var app = express();

// handlebar view engine config
var handlebars = require('express-handlebars').create({
  defaultLayout:'main',
  helpers: {
      section: function(name, options){
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      }
  }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.set('port', process.env.PORT || 3000);

app.use(express.static(__dirname + '/public'));

// body parser
app.use(require('body-parser').urlencoded({extended: true}));

// cookie credentials
app.use(require('cookie-parser')(credentials.cookieSecret));

// set showTests, context property if the querystring contains test=1
app.use(function(req, res, next){
  res.locals.showTests = app.get('env') !== 'production' && req.query.test === '1';
    next();
});

// middleware to add weather data to context
app.use(function(req, res, next){
  if (!res.locals.partials) res.locals.partials = {};
  res.locals.partials.weatherContext = getWeatherData();
  next();
});

app.get('/', function(req, res){
  res.render('home');
});

app.get('/about', function(req, res){
  res.render('about', {
    fortune : fortune.getFortune(),
    pageTestScript: '/qa/tests-about.js'
  });
});

app.get('/tours/hood-river', function(req, res){
  res.render('tours/hood-river');
});

app.get('/tours/oregon-coast', function(req, res){
  res.render('tours/oregon-coast');
});

app.get('/tours/request-group-rate', function(req, res){
  res.render('tours/request-group-rate');
});

app.get('/jquery-test', function(req, res){
  res.render('jquery-test');
});
app.get('/nursery-rhyme', function(req, res){
  res.render('nursery-rhyme');
});
app.get('/data/nursery-rhyme', function(req, res){
  res.json({
    animal: 'squirrel',
		bodyPart: 'tail',
		adjective: 'bushy',
		noun: 'heck',
  });
});

app.get('/thank-you', function(req, res){
  res.render('thank-you');
});
app.get('/newsletter', function(req, res){
  res.render('newsletter', {csrf: 'CSRF token goes here'});
});
app.get('/newsletter-ajax', function(req, res){
  res.render('newsletter-ajax', {csrf: 'CSRF token goes here'});
});
app.post('/process', function(req, res){
  console.log('Form (from querystring): ' + req.query.form);
  console.log('CSRF token (from hidden form field): ' + req.body._csrf);
  console.log('Name (from visible from field): ' + req.body.name);
  console.log('Email (from visible from field): ' + req.body.email);
  res.redirect(303, '/thank-you');
});
app.post('/process-ajax', function(req, res){
  if (req.xhr || req.accepts('json, html')==='json'){
    console.log('Form (from querystring): ' + req.query.form);
    console.log('CSRF token (from hidden form field): ' + req.body._csrf);
    console.log('Name (from visible from field): ' + req.body.name);
    console.log('Email (from visible from field): ' + req.body.email);
    res.send({success: true});
    // ({error: 'error description'})
  } else {
    res.redirect(303, '/thank-you');
  }
});

app.get('/contest/vacation-photo', function(req, res){
  var now = new Date();
  res.render('contest/vacation-photo', { year: now.getFullYear(), month: now.getMonth()});
});
app.post('/contest/vacation-photo/:year/:month', function(req, res){
  var form = new formidable.IncomingForm();
  form.parse(req, function(err, fields, files){
    if (err) return res.redirect(303, '/error');
    console.log('received field: ' + fields);
    console.log(fields);
    console.log('received files: ' + files);
    console.log(files);
    res.redirect(303, '/thank-you');
  });
});

// 404 catch-all handler (middleware)
app.use(function(req, res){
  res.status(404);
  res.render('404');
});

// 500 catch-all handler (middleware)
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500);
  res.render('500');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') +
   '; press Ctrl + C to terminate.');
});

function getWeatherData() {
  return {
    locations: [
      {
        name: 'Portland',
        forecastUrl: 'http://www.wunderground.com/US/OR/Portland.html',
        iconUrl: 'http://icons-ak.wxug.com/i/c/k/cloudy.gif',
        weather: 'Overcast',
        temp: '54.1 F (12.3 C)',
      },
      {
          name: 'Bend',
          forecastUrl: 'http://www.wunderground.com/US/OR/Bend.html',
          iconUrl: 'http://icons-ak.wxug.com/i/c/k/partlycloudy.gif',
          weather: 'Partly Cloudy',
          temp: '55.0 F (12.8 C)',
      },
      {
          name: 'Manzanita',
          forecastUrl: 'http://www.wunderground.com/US/OR/Manzanita.html',
          iconUrl: 'http://icons-ak.wxug.com/i/c/k/rain.gif',
          weather: 'Light Rain',
          temp: '55.0 F (12.8 C)',
      },
    ],
  };
}
