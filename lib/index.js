// # GTFD FilesCollection
// The GTFD FilesCollection is based on the [`node files-collection`](../node_modules/files-collection/node.js).
'use strict';
/* jshint node:true */
var fs                      = require('fs');
var _                       = require('underscore');
var mkdirp                  = require('mkdirp');
var OriginalFilesCollection = require('files-collection/node');
var glob                    = require('glob');
var path                    = require('path');

var BlocksCollection        = require('./blocks-collection');
var utils                   = require('./rendering-utils');


var defaultExp = /^[\t ]*\/\/(| |.*)$/;

// ### parseContent
function parseContent(content, lang, options) {
  options = options || {};
  var pairs = [];
  var prevLineWasDoc = false;
  var code = [];
  var documentation = [];
  var start = 0;
  var codeStart = 0;
  var current = 0;


  /*add a pair doc / code object*/
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

        documentation: documentation,
        code: code
      });
    }

    code = [];
    documentation = [];
    start = current;
    codeStart = current;
  }


  (content || '').split('\n').forEach(function (line, num) {
    /*determine if the line is aimed to document the code or the code itself*/
    var isDoc = line.match(defaultExp);
    current = num;

    if (prevLineWasDoc && !isDoc) {
      codeStart = num;
    }

    /*if a new documentation block starts*/
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

// ## GTFD FileModel
// The GTFD FileModel will extract its name when its content is changed.
// Its `blocks` collection holds pairs of documentation and code.
// When its content changes, its blocks and title are updated.
var OriginalFileModel = OriginalFilesCollection.prototype.model;
var FileModel = OriginalFileModel.extend({
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

  // ### initialize
  // Will fetch the content of the file if the file exists.
  initialize: function() {
    var self = this;

    this.on('change:content', function () {
      self.blocks.reset(parseContent(self.content, self.lang));

      if (this.lang === 'md') {
        this.title = utils.extractMDTitle(this.content);
      }
      else {
        var first = self.blocks.at(0);
        self.title = utils.extractMDTitle(first.documentation);
      }
    });

    OriginalFileModel.prototype.initialize.apply(this, arguments);

    if (this.exists && this.isFile) {
      this.fetch();
    }
  },


  // ### writeIndexHTML
  // Actually prepares an index file to be written by [writeHTML](#writehtml).
  // It will set a (truthy) value to the options.body and if an
  writeIndexHTML: function (options) {
    if (this.isFile) {
      return this;
    }
    options = _.clone(options || {});

    var index = this.index(options.indexNames);

    options.body = '<!-- index -->';
    if (index) {
      this.title = index.title;
      options.body += utils.extractMDTitle(index.content, true);
    }

    options.destination = path.join(this.collection.destination, this.filepath, 'index');
    return this.writeHTML(options);
  },


  // ### writeHTML
  writeHTML: function (options) {
    options = _.clone(options || {});

    if (this.isDir && !options.body) {
      return this.writeIndexHTML(options);
    }

    var files = this.collection;
    if (this.isIndex) {
      options.destination = path.join(files.destination, this.dirname, 'index');
    }

    var defaultThemePath = path.join(__dirname, '../resources/themes/default');

    _.defaults(options, {
      themePath:        defaultThemePath,
      templatePath:     path.join(defaultThemePath, 'file.jst'),
      assets:           'assets',
      assetsPath:       path.join(defaultThemePath, 'assets'),
      body:             '',
      templateOptions:  {}
    });

    var destination = options.destination || path.join(files.destination, this.filepath);

    var template = _.isFunction(options.template) ?
                    options.template :
                    _.template(fs.readFileSync(options.templatePath).toString());

    if (this.lang === 'md' && !options.body) {
      options.body = utils.extractMDTitle(this.content, true);
    }

    files.setActive(this.filepath);

    var data = {
      assets:       this.relative(options.assets),
      destination:  destination,

      body:         options.body,
      navigation:   utils.navigation(this),
      breadcrumb:   utils.breadcrumb(this),
      model:        this,
      options:      options.templateOptions
    };

    data.config = JSON.stringify({
      files:  files.filepaths(),
      active: this.filepath
    });

    files.trigger('writefile', this, destination + '.html');

    mkdirp.sync(path.dirname(destination));
    fs.writeFileSync(destination + '.html', template(data));
    return this;
  }
});




module.exports = OriginalFilesCollection.extend({
  model: FileModel,

  cwd: '',

  destination: '',

  assets: '',

  assetsPath: '',

  initialize: function (models, options) {
    models = models || [];
    options = options || {};
    if (!options.destination) {
      throw new Error('Missing `destination` option.');
    }

    this.destination = options.destination;
    OriginalFilesCollection.prototype.initialize.apply(this, arguments);
    this.cwd = options.cwd || '';
  },

  writeFiles: function () {
    this.forEach(function (file) {
      file.writeHTML();
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
