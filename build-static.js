#!/usr/bin/env node

/**
 * Static site generator for Chromemote.com
 * Renders all Dust.js templates to static HTML files
 * Output: /dist folder ready to upload to any static host
 */

var fs = require('fs');
var path = require('path');
var cons = require('consolidate');
var dust = require('dustjs-linkedin');
dust.helper = require('dustjs-helpers');

// ── Dust.js helpers (copied from server.js) ──

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

// ── Configure Dust.js ──

var viewsDir = path.join(__dirname, 'views');
dust.config.whitespace = true;

// Custom onLoad so Dust can resolve partials from the views directory
dust.onLoad = function(templateName, options, callback) {
  // Try the name as-is first, then without .dust, then with .dust
  var candidates = [
    path.join(viewsDir, templateName),
    path.join(viewsDir, templateName + '.dust')
  ];
  for (var c of candidates) {
    if (fs.existsSync(c)) {
      return fs.readFile(c, 'utf8', callback);
    }
  }
  callback(new Error('Template not found: ' + templateName));
};

// ── Load blog posts from NDJSON export ──

function loadBlogPosts() {
  var raw = fs.readFileSync(path.join(__dirname, 'collections', 'blog-posts.json'), 'utf8');
  var posts = raw.trim().split('\n').map(function(line) {
    return JSON.parse(line);
  }).filter(function(p) {
    return p.live === true;
  });
  // Sort by date descending
  posts.sort(function(a, b) {
    return b.date.localeCompare(a.date);
  });
  return posts;
}

// ── Render a template with Dust directly ──

function renderTemplate(templateName, data) {
  return new Promise(function(resolve, reject) {
    // Read and compile the template source
    var templatePath = path.join(viewsDir, templateName + '.dust');
    var source = fs.readFileSync(templatePath, 'utf8');
    var compiled = dust.compile(source, templateName);
    dust.loadSource(compiled);

    dust.render(templateName, data, function(err, html) {
      if (err) reject(err);
      else resolve(html);
    });
  });
}

// ── Rewrite absolute paths to relative based on file depth ──

function makePathsRelative(html, outputPath) {
  // Count directory depth from dist root (e.g. "blog/post/index.html" = depth 2)
  var depth = outputPath.split('/').length - 1; // subtract the filename
  var prefix = depth === 0 ? './' : '../'.repeat(depth);

  // Replace absolute paths in href, src, and action attributes
  html = html.replace(/((?:href|src|action)\s*=\s*["'])\/(?!\/)/g, '$1' + prefix);

  return html;
}

// ── Write file, creating dirs as needed ──

function writeFile(filePath, content) {
  var dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

// ── Copy directory recursively ──

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  var entries = fs.readdirSync(src, { withFileTypes: true });
  for (var entry of entries) {
    var srcPath = path.join(src, entry.name);
    var destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      // Skip admin assets
      if (entry.name === 'admin') continue;
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ── Generate sitemap.xml ──

function generateSitemap(blogPosts) {
  var urls = [
    { loc: '/', priority: '1.0' },
    { loc: '/blog/', priority: '0.9' },
    { loc: '/faq/', priority: '0.8' },
    { loc: '/support-us/', priority: '0.7' },
    { loc: '/press/', priority: '0.5' },
    { loc: '/update/', priority: '0.4' }
  ];

  blogPosts.forEach(function(post) {
    urls.push({ loc: '/blog/' + post.path + '/', priority: '0.6' });
  });

  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  urls.forEach(function(u) {
    xml += '  <url>\n';
    xml += '    <loc>https://chromemote.com' + u.loc + '</loc>\n';
    xml += '    <priority>' + u.priority + '</priority>\n';
    xml += '  </url>\n';
  });
  xml += '</urlset>\n';
  return xml;
}

// ── Generate .htaccess for redirects and clean URLs ──

function generateHtaccess() {
  return [
    'RewriteEngine On',
    '',
    '# Force HTTPS',
    'RewriteCond %{HTTPS} off',
    'RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]',
    '',
    '# Redirect api.* subdomain',
    'RewriteCond %{HTTP_HOST} ^api\\.(.+)$ [NC]',
    'RewriteRule ^(.*)$ https://%1/$1 [L,R=301]',
    '',
    '# Old blog URL redirects',
    'RewriteRule ^2013/(.*)$ /blog/$1 [L,R=301]',
    'RewriteRule ^2012/(.*)$ /blog/$1 [L,R=301]',
    '',
    '# Other redirects',
    'RewriteRule ^tipjar/?$ /support-us/ [L,R=301]',
    'RewriteRule ^donate/?$ /support-us/ [L,R=301]',
    'RewriteRule ^in-the-media/?$ /press/ [L,R=301]',
    '',
    '# Custom 404',
    'ErrorDocument 404 /404.html',
    '',
    '# Remove .html extension for clean URLs',
    'RewriteCond %{REQUEST_FILENAME} !-d',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME}.html -f',
    'RewriteRule ^(.*)$ $1.html [L]',
    '',
    '# Trailing slash handling - serve directory index',
    'RewriteCond %{REQUEST_FILENAME} !-f',
    'RewriteCond %{REQUEST_FILENAME} -d',
    'RewriteCond %{REQUEST_FILENAME}/index.html -f',
    'RewriteRule ^(.*)/?$ $1/index.html [L]',
    ''
  ].join('\n');
}

// ── Main build ──

async function build() {
  var distDir = path.join(__dirname, 'dist');

  // Clean dist
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
  }
  fs.mkdirSync(distDir, { recursive: true });

  var blogPosts = loadBlogPosts();
  console.log('Found ' + blogPosts.length + ' live blog posts');

  // ── Render static pages ──

  var pages = [
    { template: 'index',      out: 'index.html',                    data: { title: "Chromemote - The Google TV Remote for Chrome", pageName: "home" } },
    { template: 'faq',        out: 'faq/index.html',                data: { title: "Chromemote - Frequently Asked Questions", pageName: "faq" } },
    { template: 'contribute', out: 'support-us/index.html',         data: { title: "Chromemote - Contribute cash, code, or comments.", pageName: "contirbute", stats: { proUserTotal: "0", weeklyUserCount: "0", donationTotal: "0", donationAvg: "0.00", amountTotal: "0.00", percentageToGoal: 0 } } },
    { template: 'thank_you',  out: 'support-us/thank-you/index.html', data: { title: "Chromemote - Thanks!", pageName: "contirbute" } },
    { template: 'update',     out: 'update/index.html',             data: { title: "Chromemote - Update", pageName: "update" } },
    { template: 'press',      out: 'press/index.html',              data: { title: "Chromemote - Press", pageName: "update" } },
    { template: 'get_key',    out: 'get-key/index.html',            data: { title: "Chromemote - Activation Key", pageName: "get_key" } },
    { template: 'blog_home',  out: 'blog/index.html',               data: { title: "Chromemote - Blog", pageName: "blog", postsJSON: blogPosts } },
  ];

  for (var page of pages) {
    try {
      var html = await renderTemplate(page.template, page.data);
      html = makePathsRelative(html, page.out);
      writeFile(path.join(distDir, page.out), html);
      console.log('  ✓ ' + page.out);
    } catch(err) {
      console.error('  ✗ ' + page.out + ': ' + err.message);
    }
  }

  // ── Render individual blog posts ──

  for (var post of blogPosts) {
    try {
      var html = await renderTemplate('blog_post', {
        title: "Chromemote - " + post.title,
        pageName: "blog",
        post: [post]
      });
      var outPath = 'blog/' + post.path + '/index.html';
      html = makePathsRelative(html, outPath);
      writeFile(path.join(distDir, outPath), html);
      console.log('  ✓ ' + outPath);
    } catch(err) {
      console.error('  ✗ blog/' + post.path + ': ' + err.message);
    }
  }

  // ── Copy static assets ──

  console.log('\nCopying static assets...');
  copyDir(path.join(__dirname, 'public'), distDir);
  console.log('  ✓ public/ assets copied');

  // ── Generate sitemap.xml ──

  writeFile(path.join(distDir, 'sitemap.xml'), generateSitemap(blogPosts));
  console.log('  ✓ sitemap.xml');

  // ── Generate .htaccess ──

  writeFile(path.join(distDir, '.htaccess'), generateHtaccess());
  console.log('  ✓ .htaccess');

  // ── Generate 404 page ──

  var html404 = await renderTemplate('index', { title: "Chromemote - Page Not Found", pageName: "home" });
  html404 = makePathsRelative(html404, '404.html');
  writeFile(path.join(distDir, '404.html'), html404);
  console.log('  ✓ 404.html');

  console.log('\nBuild complete! Output in: ./dist/');
  console.log('Upload the contents of ./dist/ to your HostGator public_html directory.');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
