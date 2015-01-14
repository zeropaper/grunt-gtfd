'use strict';
/* jshint node: true */
var Model                   = require('ampersand-model');
var Collection              = require('ampersand-collection');
/*
var marked                  = require('marked');
var hljs                    = require('highlight.js');


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
*/

var BlockModel = Model.extend({
  props: {
    start:          'number',
    codeStart:      'number',
    end:            'number',
    documentation:  'string',
    code:           'string'
  },

  derived: {
    documentationHTML: {
      deps: ['documentation'],
      fn: function () {
        return marked(this.documentation);
      }
    },

    codeHTML: {
      deps: ['code'],
      fn: function () {
        return hljs.highlight(this.collection.parent.lang, this.code).value;
      }
    }
  }
});


var BlocksCollection = Collection.extend({
  model: BlockModel
});

module.exports = BlocksCollection;
