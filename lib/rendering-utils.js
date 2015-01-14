'use strict';
/* jshint node: true */

var _ = require('underscore');

function repeatStr(count, str){
  var str = str || '..';
  var arr = [];
  for (var c = 0; c <= count; c++) {
    arr.push(str);
  }
  return arr;
}





function breadcrumb(model) {
  var pieces = [];
  var used = [];
  var parts = model.dirname.split('/');
  var length = parts.length;
  var part;
  while (part = parts.shift()) {
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
    '<% } else if (["README.md", "index"].indexOf(model.filepath) > -1) { } else { %>',
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

module.exports = {
  navigation: navigation,
  breadcrumb: breadcrumb
};
