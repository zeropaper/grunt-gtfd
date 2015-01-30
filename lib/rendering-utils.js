// # Rendering utilities
//
// This module provides some functions to render code and documentation.
// You might be interested in the template [file.jst](../resources/themes/default/file.jst) used to render the a HTML page.
// The module depends on [`marked`](//github.com/chjj/marked) and [`highlight.js`](//highlightjs.org).
//
// ## marked
// The `marked` module is exported [pre-configured](#marked-options).
//
// ## renderer
// The `renderer` is used to override some default `marked` rendering.
// It is exposed on the module so that it can be used to make overrides.
// Have a look at [`extractMDTitle`](#extractmdtitle)
'use strict';
/* jshint node: true */

var _                   = require('underscore');
var fs                  = require('fs');
var path                = require('path');
var marked              = require('marked');
var hljs                = require('highlight.js');
var renderer            = new marked.Renderer();
var join                = path.join;
var read                = function (fp) {
                            return fs.readFileSync(fp).toString();
                          };
var themePath           = path.resolve(__dirname, '../resources/themes/default');
var navigationTemplate  = read(join(themePath, 'navigation.jst'));
var itemTemplate        = read(join(themePath, 'navigation-item.jst'));




// ### repeatStr
// Repeats a string a given amount of times.
function repeatStr(count, str){
  str = str || '..';
  var arr = [];
  for (var c = 0; c <= count; c++) {
    arr.push(str);
  }
  return arr;
}

// ### escapeHTML
// Can be used to replace HTML entities in a string.
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

// ## highlight
// Will return highlighted code if lang is known to [highlight.js](//highlightjs.org).
// When not, the code will only be escaped.
// The returned string, when not empty, is wrapped with a `pre` and a `code` elements.
function highlight(code, lang) {
  var str;
  if (!lang || !hljs.getLanguage(lang)) {
    str = escapeHTML(code);
  }
  else {
    str = hljs.highlight(lang, code).value;
  }

  str = str ? ('<pre><code class="' + lang + '">' + str + '</code></pre>') : '';

  return str;
}

// ### isLocalLink
// Determines if a href is an external URL or referencing a project file.
// A anchor href (starting with `#`) returns false.
function isLocalLink(href) {
  return (
            href.slice(0, 2) === './' ||
            href.slice(0, 3) === '../' ||
            href.indexOf('://') < 0
          ) &&
          href[0] !== '#' &&
          href.slice(0, 2) !== '//'
          ;
}

// ### localLink
// Appends a `.html` to the href before first `#` (if any) but not when starting with `#`.
function localLink(href) {
  var parts = href.split('#');
  if (!parts[0]) {
    return href;
  }
  parts[0] = parts[0] + '.html';
  return parts.join('#');
}





// ## renderer.link
// Ensure a `.html` is append to project file paths in the rendered markdown.
renderer.link = function (href, title, text) {
  var localHref = (isLocalLink(href) ? localLink(href) : href);
  return '<a href="' +
          localHref +
          (title ? ('" title="' + escapeHTML(title)) : '') +
          '">' +
          text +
          '</a>';
};





// ## renderer.heading
// Adds a link to reference the heading. The link added is empty but can be styled with CSS.
renderer.heading = function (text, level) {
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');
  return '<h' + level + ' id="' +
          escapedText +
          '">' +
          text +
          '<a class="anchor" href="#' +
          escapedText +
          '"></a>' +
          '</h' + level + '>';
};



// ### configurations
// #### highlight.js options
hljs.configure({
  tabReplace: '  '
});

// #### marked options
// It uses the line breaks parsing of [GitHub](//help.github.com/articles/writing-on-github/#newlines), has `highlight.js` and the `renderer`.
marked.setOptions({
  breaks: true,
  smartypants: true,
  highlight: highlight,
  renderer: renderer
});



// ## breadcrumb
// Renders a _breadcrumb_ for the model.
function breadcrumb(model) {
  var pieces = [];
  var used = [];
  var parts = model.dirname.split('/');
  var part;
  while (parts.length) {
    part = parts.shift();
    var partPath = repeatStr(parts.length - 1).join('/');
    used.push(part);
    if (model.collection.get(used.join('/') + '/index.html')) {
      pieces.push('<li><a href="' + partPath + '/index.html">' + part + '</a></li>');
    }
    else {
      pieces.push('<li>' + part + '</li>');
    }
  }
  return  '<ul class="breadcrumb">' + pieces.join('') + '</ul>';
}


// ## navigation
// Renders the navigation tree for a file model.
// Have a look at the templates:
// - [navigation.jst](../resources/themes/default/navigation.jst)
// - [navigation-item.jst](../resources/themes/default/navigation-item.jst)
function navigation(model) {
  var navigationItem = _.template(itemTemplate);

  return _.template(navigationTemplate)({
    navigationItem: navigationItem,
    collection: model.collection
  });
}

// ## extractMDTitle
// Can be used to extract the first level 1 (h1) of a text.
// By setting wantText argument to true, the returned string is the text without the first h1.
function extractMDTitle(str, wantText) {
  var title = '';

  var originalHeading = renderer.heading;

  renderer.heading = function (text, level) {
    if (!title && (level === '1' || level === 1)) {
      title = text;
      return '';
    }
    return originalHeading(text, level);
  };

  var withoutTitle = marked(str);

  renderer.heading = originalHeading;

  return wantText ? withoutTitle : title;
}


// ## setTheme
// Provides a function to change the theme path and reload the templates accordingly.
function setTheme(newThemePath) {
  themePath           = newThemePath;
  navigationTemplate  = read(join(themePath, 'navigation.jst'));
  itemTemplate        = read(join(themePath, 'navigation-item.jst'));
}


// ### exports
// - [`navigation`](#navigation)
// - [`breadcrumb`](#breadcrumb)
// - [`marked`](#marked)
// - [`renderer`](#renderer)
// - [`highlight`](#highlight)
// - [`extractMDTitle`](#extractmdtitle)
// - [`setTheme`](#settheme)
module.exports = {
  navigation:     navigation,
  breadcrumb:     breadcrumb,
  marked:         marked,
  renderer:       renderer,
  highlight:      highlight,
  extractMDTitle: extractMDTitle,
  setTheme:       setTheme
};
