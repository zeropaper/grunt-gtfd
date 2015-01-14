var Model           = require('ampersand-model');
var Collection      = require('ampersand-collection');
var View            = require('ampersand-view');

var SearchResults = Collection.extend({
  comparator: function (a, b) {
    return a.score < b.score;
  },

  model: Model.extend({
    props: {
      score: ['number', false, 0],
      label: 'string',
      value: 'string'
    },

    session: {
      focused: 'boolean'
    },

    derived: {
      index: {
        deps: ['collection'],
        fn: function () {
          return this.collection.indexOf(this);
        }
      }
    }
  }),

  indexPos: 0,

  prev: function () {
    if (!this.length) {
      return false;
    }

    this.indexPos = this.indexPos - 1;

    if (this.indexPos < 0) {
      this.indexPos = this.length - 1;
    }
    return this.at(this.indexPos);
  },

  next: function () {
    if (!this.length) {
      return false;
    }

    this.indexPos = this.indexPos + 1;

    if (this.indexPos === this.length) {
      this.indexPos = 0;
    }
    return this.at(this.indexPos);
  },

  initialize: function () {
    this.on('reset', function (collection) {
      collection.index = 0;
      collection.setFocused(0);
    });
  },

  setFocused: function (focusedModel) {
    if (!isNaN(focusedModel)) {
      focusedModel = this.at(focusedModel);
    }

    this.forEach(function (model) {
      if (focusedModel.cid === model.cid) { return; }

      model.set({
        focused: false
      });
    });

    if (focusedModel && !focusedModel.focused) {
      focusedModel.focused = true;
    }

    return this;
  }
});


var SearchResult = View.extend({
  autoRender: true,
  template: '<div><div class="score"></div><a class="label"></a></div>',

  bindings: {
    'model.label': {
      type: 'text',
      selector: '.label'
    },
    'model.value': {
      type: function (el, value/*, previousValue*/) {
        el.setAttribute('href', value + '.html');
      },
      selector: '.label'
    },
    'model.score': {
      type: 'text',
      selector: '.score'
    },
    'model.focused': {
      type: 'booleanClass',
      name: 'focused'
    }
  }
});


module.exports = View.extend({
  autoRender: true,

  results: null,

  facets: null,

  template: [
    '<div class="search">',
      '<div class="options"></div>',
      '<div>',
        '<input class="form-control" placeholder="Search" type="search" />',
      '</div>',
      '<div class="results">',
      '</div>',
    '</div>'
  ].join('\n'),

  events: {
    'keyup input': 'searchKeyup',
    'keydown input': 'searchKeydown'
  },

  initialize: function () {
    this.results = new SearchResults();
  },

  searchKeydown: function (evt) {
    if (evt.keyCode === 13) {
      if (this.results.length) {
        var href = this.results.at(this.results.indexPos).value;
        console.info('go to', href);
        location.href = href;
      }
      evt.preventDefault();
    }
    else if (evt.keyCode === 40) {
      this.results.setFocused(this.results.next());
      evt.preventDefault();
    }
    else if (evt.keyCode === 38) {
      this.results.setFocused(this.results.prev());
      evt.preventDefault();
    }
  },

  searchKeyup: function (evt) {
    if ([13, 40, 38].indexOf(evt.keyCode) < 0) {
      this.search();
    }
  },

  searchInputExp: /([^\s]+:[\s]*[^\s]+|[^\s]+)/g,

  search: function () {
    if (this.inputEl.value === this.value) {
      return this;
    }

    this.value = this.inputEl.value;
    if (!this.value) {
      this.results.reset([]);
      return this;
    }

    var searches = (this.value.match(this.searchInputExp) || []).map(function (search) {
      search = search.split(': ');

      return {
        type: search.length > 1 ? search[0] : 'exp',
        target: 'filepath',
        value: search.length === 1 ? search[0] : search.slice(1).join(': ')
      };
    });

    var found = [];
    this.collection.forEach(function (model) {
      var score = 0;

      searches.forEach(function (search) {
        switch (search.type) {
          case 'exp':
            score = score + (model[search.target].split(search.value).length - 1);
            break;

          case 'tag':
            score = score + model.tags.filter(function (tag) {
              return tag.name === search.value;
            }).length;
            break;
        }
      });

      if (score) {
        found.push({
          score: score,
          label: model.filepath,
          value: model.fileurl
        });
      }
    });

    this.results.reset(found).sort();

    return this;
  },

  render: function () {
    this.renderWithTemplate();

    this.cacheElements({
      optionsEl: '.options',
      resultsEl: '.results',
      inputEl: 'input'
    });

    this.renderCollection(this.results, SearchResult, this.resultsEl);

    return this;
  }
});
