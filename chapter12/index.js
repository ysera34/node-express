var express = require('express');
var fortune = require('./lib/fortune.js');
var formidable = require('formidable');
var credentials = require('./credentials.js');

var app = express();
var emailService = require('./lib/email.js')(credentials);

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

// logging
switch (app.get('env')) {
  case 'development':
    // compact, colorful dev logging
    console.log("development mode");
    app.use(require('morgan')('dev'));
    break;
  case 'production':
    // module 'express-logger' supports daily log rotation
    console.log("production mode");
    app.use(require('express-logger')({path: __dirname + '/log/requests.log'}));
    break;
}

// cookie credentials, session configuration
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
  resave: false,
  saveUninitialized: false,
  secret: credentials.cookieSecret
}));

// flash message middleware
app.use(function(req, res, next){
  // if there's a flash message, transfer
  // it to the context, then clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

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

// for now, we're mocking NewsletterSignup;
function NewsletterSignup(){
}
NewsletterSignup.prototype.save = function(cb){
  cb();
}

var VALID_EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

app.post('/newsletter', function(req, res){
  var name = req.body.name || '', email = req.body.email || '';
  // check validation
  if (!email.match(VALID_EMAIL_REGEX)) {
    if (req.xhr) return res.json({error:'Invalid name email address.'});
    req.session.flash = {
      type: 'danger',
      intro: 'Validation error!',
      message: 'The email address you entered was not valid.',
    };
    return res.redirect(303, '/newsletter/archive');
  }
  new NewsletterSignup({name: name, email: email}).save(function(err){
    if (err) {
      if (req.xhr) return res.json({error: 'Database error.'});
      req.session.flash = {
        type: 'danger',
        intro: 'Database error!',
        message: 'There was a database error; please try again later.',
      };
      return res.redirect(303, '/newsletter/archive');
    }
    if (req.xhr) return res.json({success: true});
    req.session.flash = {
      type: 'success',
      intro: 'Thank you!',
      message: 'You have now been signed up for the newsletter.',
    };
    return res.redirect(303, '/newsletter/archive');
  });
});
app.get('/newsletter/archive', function(req, res){
  res.render('newsletter/archive');
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

var cartValidation = require('./lib/cartValidation.js');

app.use(cartValidation.checkWaivers);
app.use(cartValidation.checkGuestCounts);

app.post('/cart/add', function(req, res, next){
  var cart = req.session.cart || (req.session.cart = {item: []});
  Product.findOne({ sku: req.body.sku}, function(err, product){
    if (err) return next(err);
    if (!product) return next(new Error('Unknown product SKU: ' + req.body.sku));
    cart.items.push({
        product: product,
        guests: req.body.guests || 0,
    });
    res.redirect(303, '/cart');
  });
});
app.get('/cart', function(req, res, next){
  var cart = req.session.cart;
  console.log("cart: " + cart);
  if(!cart) next();
  res.render('cart', {cart: cart});
});
app.get('/cart/checkout', function(req, res, next){
  var cart = req.session.cart;
  if (!cart) next();
  res.render('cart-checkout');
});
app.get('/cart/thank-you', function(req, res){
  res.render('cart-thank-you', {cart: req.session.cart});
});
app.get('/email/cart/thank-you', function(req, res){
  res.render('email/cart-thank-you', {cart: req.session.cart, layout: null});
});
app.post('/cart/checkout', function(req, res){
  var cart = req.session.cart;
  if(!cart) next(new Error('Cart does not exist.'));
  var name = req.body.name || '', email = req.body.email || '';
  // input validation
  if (!email.match(VALID_EMAIL_REGEX)) return res.next(new Error('Invalid email address.'));
  // assign a random cart ID; normally we would use a database ID here
  cart.number = Math.random().toString().replace(/^0\.0*/, '');
  cart.billing = {
    name: name,
    email: email,
  };
  res.render('email/cart-thank-you', {layout: null}, function(err, html){
    if (err) console.log('error in email template');
    emailService.send(cart.billing.email,
      'Thank you for booking your trip with Meadowlark Travel!',
      html);
  });
  res.render('cart-thank-you', {cart: cart});
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

// mocking product database
function Product(){
}
Product.find = function(conditions, fields, options, cb){
	if(typeof conditions==='function') {
		cb = conditions;
		conditions = {};
		fields = null;
		options = {};
	} else if(typeof fields==='function') {
		cb = fields;
		fields = null;
		options = {};
	} else if(typeof options==='function') {
		cb = options;
		options = {};
	}
	var products = [
		{
			name: 'Hood River Tour',
			slug: 'hood-river',
			category: 'tour',
			maximumGuests: 15,
			sku: 723,
		},
		{
			name: 'Oregon Coast Tour',
			slug: 'oregon-coast',
			category: 'tour',
			maximumGuests: 10,
			sku: 446,
		},
		{
			name: 'Rock Climbing in Bend',
			slug: 'rock-climbing/bend',
			category: 'adventure',
			requiresWaiver: true,
			maximumGuests: 4,
			sku: 944,
		}
	];
	cb(null, products.filter(function(p) {
		if(conditions.category && p.category!==conditions.category) return false;
		if(conditions.slug && p.slug!==conditions.slug) return false;
		if(isFinite(conditions.sku) && p.sku!==Number(conditions.sku)) return false;
		return true;
	}));
};
Product.findOne = function(conditions, fields, options, cb){
	if(typeof conditions==='function') {
		cb = conditions;
		conditions = {};
		fields = null;
		options = {};
	} else if(typeof fields==='function') {
		cb = fields;
		fields = null;
		options = {};
	} else if(typeof options==='function') {
		cb = options;
		options = {};
	}
	Product.find(conditions, fields, options, function(err, products){
		cb(err, products && products.length ? products[0] : null);
	});
};
