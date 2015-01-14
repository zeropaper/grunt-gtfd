// # Client scripts
//
// compile using browserify:
// ```js
// browserify -s gtfd scripts.src.js -o scripts.js
// ```

/* jshint browser: true, node: true */
'use strict';
var FilesCollection = require('files-collection');
var View            = require('ampersand-view');
var DocsSearchView  = require('./search.src');



// ## DocsNavView
var DocsNavView = View.extend({
  events: {
    'click li > span': 'openDirectory'
  },

  openDirectory: function (evt) {
    var listEl = evt.delegateTarget.parentNode;
    var has = listEl.className.indexOf('open') > -1;
    if (has) {
      listEl.className = listEl.className.replace('open', '');
    }
    else {
      listEl.className = listEl.className + ' open';
    }
  },

  initialize: function (options) {
    options = options || {};
    var searchEl = this.query('.search');
    if (searchEl) {
      this.searchView = new DocsSearchView({
        collection: this.collection,
        el: searchEl
      });
      this.registerSubview(this.searchView);
    }
  }
});


// ## DocsView
module.exports = View.extend({
  initialize: function (options) {
    options = options || {};
    var docsEl = this.query('nav.docs-nav');
    if (docsEl) {
      this.docsView = new DocsNavView({
        collection: new FilesCollection(options.files || [], {
          active: options.active
        }),
        el: docsEl
      });
      this.registerSubview(this.docsView);
    }
  }
});
