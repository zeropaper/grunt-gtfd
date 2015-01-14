// # whatsupdoc library
'use strict';
/* jshint node:true */
var lib               = module.exports = {};

var fs                = require('fs');
var _                 = require('underscore');
var mkdirp            = require('mkdirp');
var marked            = require('marked');
var hljs              = require('highlight.js');
var FilesCollection   = require('files-collection');
var glob              = require('glob');
var path              = require('path');

hljs.configure({
  tabReplace: '  '
});

lib.defaultExp = /^[\t ]*\/\/ (.*)$/;

// ## processDocumentation
lib.processDocumentation = function (str) {
  hljs.configure({
    tabReplace: '  '
  });

  marked.setOptions({
    smartypants: true,

    highlight: function(code, lang) {
      if (!hljs.getLanguage(lang)) {
        return code;
      }

      return hljs.highlight(lang, code).value;
    }
  });

  return marked(str);
};

// ## processCode
lib.processCode = function (lang, str) {
  return hljs.highlight(lang, str).value;
};

// ## getLang
// A bit naive for now.
lib.getLang = function (filepath) {
  return filepath.split('.').pop();
};

// ## parseFile
lib.parseFile = function (filepath, options) {
  options = options || {};
  var pairs = [];
  var prevLineWasDoc = false;
  var lang = lib.getLang(filepath);
  var code = [];
  var documentation = [];
  var start = 0;
  var current = 0;

  // add a pair doc / code object
  function pair() {
    pairs.push({
      /*
      start: start,
      end: num - 1,
      lang: lang,
      */
      documentation: lib.processDocumentation(documentation.join('\n'), options.marked || {}),
      code: lib.processCode(lang, code.join('\n'), options.highlight || {})
    });

    code = [];
    documentation = [];
    start = current;
  }

  // With all the lines of the file (located at `filepath`) we have to:
  fs.readFileSync(filepath).toString().split('\n').forEach(function (line, num) {
    // Determine if the line is aimed to document the code or the code itself.
    var isDoc = line.match(lib.defaultExp);
    current = num;

    // If a new documentation block starts
    if (!prevLineWasDoc && !!isDoc) {
      pair();
    }

    if (!!isDoc) {
      documentation.push(isDoc[1]);
    }
    else {
      code.push(line);
    }

    prevLineWasDoc = !!isDoc;
  });

  pair();
  return pairs;
};

function prepareOptions(options) {
  options.cwd           = options.cwd ?
                          options.cwd + '/' :
                          '';
  options.themePath     = options.themePath || __dirname +'/../resources/themes/default';
  options.templatePath  = options.templatePath || options.themePath + '/file.jst';
  options.template      = typeof options.template === 'function' ?
                          options.template :
                          _.template(fs.readFileSync(options.templatePath).toString());
  options.assets        = options.assets || 'assets';
  options.assetsPath    = options.assetsPath || options.themePath + '/' + options.assets;
  return options;
}

// ## writeFileDocumentation
lib.writeFileDocumentation = function (filepath, destination, options) {
  options = prepareOptions(options || {});

  var data = {
    blocks: lib.parseFile(options.cwd + filepath),
    pageTitle: options.pageTitle || filepath,
    assets: options.assets,
    navigation: '',
    breadcrumb: '',
    config: '{}'
  };

  fs.writeFileSync(destination, options.template(data));
};


function navigation(model) {
  var fileTemplate = _.template([
    '<% if (model.isDir) { %>',
      '<% var index = model.files.get("index");',
      'if (!index) { %>',
        '<span class="dirname"><%= model.basename %></span>',
      '<% } else { %>',
        '<a href="<%= model.fileurl %>.html"><%= model.basename %></a>',
      '<% } %>',

      '<ul class="directory">',
      '<% model.files.forEach(function (child) { %>',
        '<li class="<%= (child.active ? "active" : (child.trail ? "trail" : "")) %>">',
          '<%= fileTemplate({ model: child, fileTemplate: fileTemplate }) %>',
        '</li>',
      '<% }) %>',
      '</ul>',
    '<% } else { %>',
      '<a href="<%= model.fileurl %>.html"><%= model.basename %></a>',
    '<% } %>'
  ].join('\n'));

  return _.template([
    '<nav class="docs-nav">',
      '<div class="search"></div>',
      '<div class="toggle">Files</div>',
      '<ul class="directory root"><% collection.get(".").files.forEach(function (child) { %>',
        '<li class="<%= (child.active ? "active" : (child.trail ? "trail" : "")) %>">',
          '<%= fileTemplate({ model: child, fileTemplate: fileTemplate }) %>',
        '</li>',
      '<% }) %></ul>',
    '</nav>'
  ].join('\n'))({
    fileTemplate: fileTemplate,
    collection: model.collection
  });
}

// ## writeProjectDocumentation
lib.writeProjectDocumentation = function (files, dest, options) {
  options = options || {};
  if (!Array.isArray(files)) {
    options = files;
    if (!Array.isArray(options.files)) {
      throw new Error('Missing files');
    }

    files = options.files;
    dest = options.dest;
  }

  options = prepareOptions(options);

  files = new FilesCollection(files.map(function (filepath) {
    return { filepath: filepath };
  }), options.collectionOptions || {});

  files.forEach(function (model) {
    if (model.isDir || model.isRootDir) {
      return;
    }

    var data = {
      pageTitle: options.pageTitle || model.filepath
    };

    files.setActive(model.filepath);

    _.extend(data, options.data || {}, {
      blocks: lib.parseFile(options.cwd + model.filepath),
      assets: model.relative() + '/' + options.assets,
      navigation: navigation(model),
      breadcrumb: '',
      config: JSON.stringify({
        files: files.filepaths(),
        active: model.filepath
      }, null, 2)
    });

    mkdirp.sync(dest + '/' + model.dirname);
    fs.writeFileSync(dest + '/' + model.filepath + '.html', options.template(data));
  });


  glob.sync(options.assetsPath +'/**/*', {
    cwd: options.cwd
  }).forEach(function (assetpath) {
    var assetRelative = path.join(options.assets, path.relative(options.assetsPath, assetpath));
    var assetDest = path.join(dest, assetRelative);
    var stats = fs.statSync(assetpath);

    if (!stats.isDirectory()) {
      mkdirp.sync(path.dirname(assetDest));
      fs.writeFileSync(assetDest, fs.readFileSync(assetpath));
    }
  });
};
