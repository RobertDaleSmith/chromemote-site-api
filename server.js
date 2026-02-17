var express = require('express');
var path = require('path');
var cons = require('consolidate');
var cors = require('cors');
var favicon = require('serve-favicon');
var { SitemapStream, streamToPromise } = require('sitemap');

var app = express();

// Custom Dust.JS helpers
var dust = require('dustjs-linkedin');
dust.helper = require('dustjs-helpers');

if (!dust.helpers) dust.helpers = {};

dust.helpers.formatIndex = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  text = text.split(';');
  var idx = text[0];
  var len = text[1];
  var reversed = (idx - len) * -1;
  return chunk.write(reversed);
};

dust.helpers.getMonth = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = parseInt(text.substring(5,7));
  switch(res) {
    case 1:  res = "Jan"; break; case 2:  res = "Feb"; break; case 3:  res = "Mar"; break;
    case 4:  res = "Apr"; break; case 5:  res = "May"; break; case 6:  res = "Jun"; break;
    case 7:  res = "Jul"; break; case 8:  res = "Aug"; break; case 9:  res = "Sept";break;
    case 10: res = "Oct"; break; case 11: res = "Nov"; break; case 12: res = "Dec"; break;
  }
  return chunk.write(res);
};

dust.helpers.getYear = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = parseInt(text.substring(0,4));
  return chunk.write(res);
};

dust.helpers.getDay = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = parseInt(text.substring(8,10));
  return chunk.write(res);
};

dust.helpers.getDate = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = text.substring(0,10);
  return chunk.write(res);
};

dust.helpers.getTime = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var res = text.substring(11,text.length);
  return chunk.write(res);
};

dust.helpers.makeShorter = function (chunk, context, bodies, params) {
  var text = dust.helpers.tap(params.value, chunk, context);
  var limit = 100;
  var res = text.substring(0,limit);
  if(text.length > limit) res = res+"...";
  return chunk.write(res);
};

// View engine setup
app.engine('dust', cons.dust);
app.set('view engine', 'dust');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(express.static(path.join(__dirname, 'public'), {redirect: false}));

// Redirect api.* subdomain to root domain
app.all(/.*/, function(req, res, next) {
  var host = req.header("host");
  if (host && host.match(/^api\..*/i)) {
    res.redirect(301, "https://" + host.replace('api.','') + req.originalUrl);
  } else {
    next();
  }
});

// Routes
app.get('/', function(req, res) {
  res.render('index', { title: "Chromemote - The Google TV Remote for Chrome", pageName: "home" });
});

app.get('/faq', function(req, res) {
  res.render('faq', { title: "Chromemote - Frequently Asked Questions", pageName: "faq" });
});

app.get('/support-us', function(req, res) {
  var stats = {
    proUserTotal: "0",
    weeklyUserCount: "0",
    donationTotal: "0",
    donationAvg: "0.00",
    amountTotal: "0.00",
    percentageToGoal: 0
  };
  res.render('contribute', { title: "Chromemote - Contribute cash, code, or comments.", pageName: "contirbute", stats: stats });
});

app.get('/tipjar', function(req, res) {
  res.redirect('/support-us');
});

app.get('/donate', function(req, res) {
  res.redirect('/support-us');
});

app.get('/support-us/thank-you', function(req, res) {
  res.render('thank_you', { title: "Chromemote - Thanks!", pageName: "contirbute" });
});

app.get('/update', function(req, res) {
  res.render('update', { title: "Chromemote - Update", pageName: "update" });
});

app.get('/in-the-media', function(req, res) {
  res.redirect('/press');
});

app.get('/press', function(req, res) {
  res.render('press', { title: "Chromemote - Press", pageName: "update" });
});

app.get('/blog', function(req, res) {
  res.render('blog_home', { title: "Chromemote - Blog", pageName: "blog" });
});

app.get('/blog/:path', function(req, res) {
  res.render('blog_post', { title: "Chromemote - Blog", pageName: "blog" });
});

app.get('/2013/:path', function(req, res) {
  res.redirect('/blog/' + req.params.path);
});

app.get('/2012/:path', function(req, res) {
  res.redirect('/blog/' + req.params.path);
});

app.get('/get-key', function(req, res) {
  res.render('get_key', { title: "Chromemote - Activation Key", pageName: "get_key" });
});

// Sitemap
var sitemapUrls = [
  { url: '/',  changefreq: 'monthly', priority: 1.0 },
  { url: '/blog/',  changefreq: 'daily',  priority: 0.9 },
  { url: '/faq/',  changefreq: 'monthly',  priority: 0.8 },
  { url: '/support-us/',  changefreq: 'monthly',  priority: 0.7 },
  { url: '/support-us/thank-you/',  changefreq: 'monthly',  priority: 0.6 },
  { url: '/press/',  changefreq: 'monthly',  priority: 0.5 },
  { url: '/update/',  changefreq: 'monthly',  priority: 0.4 }
];

var cachedSitemapXml = null;

app.get('/sitemap.xml', function(req, res) {
  if (cachedSitemapXml) {
    res.header('Content-Type', 'application/xml');
    res.send(cachedSitemapXml);
    return;
  }
  var stream = new SitemapStream({ hostname: 'http://chromemote.com' });
  sitemapUrls.forEach(function(url) { stream.write(url); });
  stream.end();
  streamToPromise(stream).then(function(data) {
    cachedSitemapXml = data.toString();
    res.header('Content-Type', 'application/xml');
    res.send(cachedSitemapXml);
  });
});

module.exports = app;
