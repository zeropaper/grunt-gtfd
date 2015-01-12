// # whatsupdoc library
var lib = module.exports = {};
var fs = require('fs');
var _ = require('underscore');
var marked = require('marked');
var hljs = require('highlight.js');

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

// ## writeFileDocumentation
lib.writeFileDocumentation = function (filepath, destination, options) {
  options = options || {};
  var data = {
    blocks: lib.parseFile(filepath),
    pageTitle: options.pageTitle || filepath,
    assets: options.assetsPath || '.'
  };
  var templatePath = __dirname +'/../resources/themes/default/file.jst';
  var template = _.template(fs.readFileSync(templatePath).toString());
  fs.writeFileSync(destination, template(data));
};


// ## writeProjectDocumentation
lib.writeProjectDocumentation = function (files, dest, options) {
  options = options || {};

};
