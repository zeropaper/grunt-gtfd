// # BlocksCollection
// Is used to store the [blocks](#block-model) of a [file model](index.js#gtfd-filemodel).
'use strict';
/* jshint node: true */
var Model                   = require('ampersand-model');
var Collection              = require('ampersand-collection');
var utils                   = require('./rendering-utils');


// ## Block model
// has a set of information about the a pair of documentation and code
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
        if (!this.documentation) {
          return '';
        }

        if (this.collection.indexOf(this) === 0) {
          return utils.extractMDTitle(this.documentation, true);
        }

        return utils.marked(this.documentation);
      }
    },

    codeHTML: {
      deps: ['code'],
      fn: function () {
        if (!this.code) {
          return '';
        }

        return utils.highlight(this.code, this.collection.parent.lang);
      }
    }
  }
});


module.exports = Collection.extend({
  model: BlockModel,
  HTML: function () {
    return this.map(function (block) {
      return '<div class="row">' +
             '<div class="documentation">' + block.documentationHTML + '</div>' +
             '<div class="code">' + block.codeHTML + '</div>' +
             '</div>';
    }).join('');
  }
});
