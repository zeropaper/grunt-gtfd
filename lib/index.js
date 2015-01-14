// # gtfd library
//
'use strict';
/* jshint node:true */
var fs                      = require('fs');
var _                       = require('underscore');
var mkdirp                  = require('mkdirp');
var marked                  = require('marked');
var hljs                    = require('highlight.js');
var OriginalFilesCollection = require('files-collection/node');
var glob                    = require('glob');
var path                    = require('path');

var BlocksCollection        = require('./blocks-collection');
var utils                   = require('./rendering-utils');


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



var defaultExp = /^[\t ]*\/\/(| |.*)$/;


function parseContent(content, lang, options) {
  options = options || {};
  var hljsLang = hljs.getLanguage(lang);
  var pairs = [];
  var prevLineWasDoc = false;
  var code = [];
  var documentation = [];
  var start = 0;
  var codeStart = 0;
  var current = 0;


  // add a pair doc / code object
  function pair() {
    if (documentation.length || code.length) {
      documentation = documentation.join('\n');
      code = code.join('\n');

      pairs.push({
        start: start,
        codeStart: codeStart,
        end: current - 1,
        lang: lang,

        original: {
          code: code,
          documentation: documentation,
        },

        documentation: marked(documentation),
        code: '<pre><code class="' + lang + '">' +
              (!!hljsLang ? hljs.highlight(lang, code).value : code) +
              '</code></pre>'
      });
    }

    code = [];
    documentation = [];
    start = current;
    codeStart = current;
  }


  (content || '').split('\n').forEach(function (line, num) {
    // Determine if the line is aimed to document the code or the code itself.
    var isDoc = line.match(defaultExp);
    current = num;
    console.info(documentation.length, code.length, !!isDoc, !prevLineWasDoc && !!isDoc, '' + (!!isDoc ? isDoc[1] : 'nopeeeeee'));

    if (prevLineWasDoc && !isDoc) {
      codeStart = num;
    }

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
}



var OriginalFileModel = OriginalFilesCollection.prototype.model;
var FileModel = OriginalFileModel.extend({
  initialize: function() {
    var self = this;

    this.on('change:content', function () {
      self.blocks.reset(parseContent(self.content, self.lang));
    });

    OriginalFileModel.prototype.initialize.apply(this, arguments);

    if (this.exists && this.isFile) {
      this.fetch();
    }
  },

  collections: {
    blocks: BlocksCollection
  },

  props: {
    title: 'string'
  },

  derived: {
    absolutePath: {
      deps: ['filepath'],
      cache: false,
      fn: function () {
        return this.collection.cwd ?
                path.join(this.collection.cwd, this.filepath) :
                this.filepath;
      }
    },

    exists: {
      deps: ['filepath'],
      cache: false,
      fn: function () {
        return fs.existsSync(this.absolutePath);
      }
    },

    isDir: {
      deps: ['filepath'],
      cache: false,
      fn: function () {
        return this.exists ? fs.statSync(this.absolutePath).isDirectory() : false;
      }
    },

    isFile: {
      deps: ['filepath'],
      cache: false,
      fn: function () {
        return this.exists ? fs.statSync(this.absolutePath).isFile() : false;
      }
    },

    lang: {
      deps: ['filepath'],
      fn: function () {
        if (this.isDir) {
          return false;
        }
        return this.filepath.split('.').pop();
      }
    }
  },

  writeHTML: function (options) {
    options = _.clone(options || {});
    var files = this.collection;
    var defaultThemePath = path.join(__dirname, '../resources/themes/default');

    _.defaults(options, {
      themePath:    defaultThemePath,
      templatePath: path.join(defaultThemePath, 'file.jst'),
      assets:       path.join(this.relative(), 'assets'),
      assetsPath:   path.join(defaultThemePath, 'assets'),
      body:         '',
      blocks:       this.blocks.toJSON(),
      pageTitle:    this.basename,
      multiFiles:   false
    });

    var destination = options.destination || path.join(files.destination, this.filepath);
    if (options.body) {
      options.blocks = [];
    }

    var template = _.isFunction(options.template) ?
                    options.template :
                    _.template(fs.readFileSync(options.templatePath).toString());

    /*var active = '';*/
    files.setActive(this.filepath);

    var data = {
      multiFiles:   options.multiFiles,
      pageTitle:    options.pageTitle,
      assets:       options.assets,
      destination:  destination,

      navigation:   utils.navigation(this),
      breadcrumb:   utils.breadcrumb(this),
      model:        this
    };

    /*files.setActive(active);*/

    data.config = JSON.stringify({
      files:  files.filepaths(),
      active: this.filepath
    });

    files.trigger('writefile', this, destination);

    mkdirp.sync(path.dirname(destination));
    fs.writeFileSync(destination + '.html', template(data));
    return this;
  }
});




var FilesCollection = module.exports = OriginalFilesCollection.extend({
  model: FileModel,

  cwd: '',

  destination: '',

  assets: '',

  assetsPath: '',

  initialize: function (models, options) {
    models = models || [];
    options = options || {};
    if (!options.destination) {
      throw new Error('Missing `destination` option.')
    }

    this.destination = options.destination;
    OriginalFilesCollection.prototype.initialize.apply(this, arguments);
    this.cwd = options.cwd || '';
  },

  writeFiles: function () {
    var index = this.get('index');
    var readme = this.get('README.md');
    var self = this;

    this.forEach(function (file) {
      if (!index && file.filepath === '.') {
        if (readme) {
          file.body = marked(readme.content || '');
          file.title = readme.title || file.title;
        }
        else {
          file.body = 'Add a README.md';
        }

        file.writeHTML({
          destination: path.join(self.destination, 'index')
        });
      }
      else if (!index && file.filepath === 'README.md') {
         /*do nothing*/
      }
      else if(file.isFile) {
        file.writeHTML();
      }
    });

    return this.copyAssets();
  },

  copyAssets: function (options) {
    options = options || {};

    var files = this;
    var cwd = options.cwd || this.cwd;
    var themePath = options.themePath || path.join(__dirname, '../resources/themes/default');
    var assets = options.assets || this.assets || 'assets';
    var assetsPath = options.assetsPath || path.join(themePath, assets);
    var destination = options.destination || this.destination;

    glob.sync(assetsPath +'/**/*', {
      cwd: cwd
    }).forEach(function (assetpath) {
      var assetRelative = path.join(assets, path.relative(assetsPath, assetpath));
      var assetDest = path.join(destination, assetRelative);
      var stats = fs.statSync(assetpath);

      if (!stats.isDirectory()) {
        files.trigger('copyasset', assetRelative);

        mkdirp.sync(path.dirname(assetDest));
        fs.writeFileSync(assetDest, fs.readFileSync(assetpath));
      }
    });
  }
});
