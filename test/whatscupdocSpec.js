var expect = require('expect.js');
var fs = require('fs');
var tmp = require('tmp');
var lib;

function err(label) {
  return function (error) {
    console.info(label, error.stack);
  }
}

describe('whatsupdoc library', function () {
  before(function () {
    lib = require('./../lib');
  });

  describe('processDocumentation', function () {
    var processed;
    var original = [
      'first comment line,',
      'second comment line',
      '```js',
      'var someVar = 3;',
      'function foo() {\n  return \'bar\';\n}',
      '```',
      '*italic*',
      '',
      'New paragraph  ',
      'new line'
    ].join('\n');

    it('process the comment blocks', function () {
      expect(function () {
        processed = lib.processDocumentation(original);
      }).not.to.throwError(err('processing comment'));
    });

    describe('result', function () {
      it('has parsed the markdown', function () {
        expect(processed).to.match(/<p>/);
        expect(processed).to.match(new RegExp('<p>New paragraph<br>new line</p>'));
      });

      it('has highlighted the example', function () {
        expect(processed).to.match(new RegExp('<span class="hljs-title">foo</span>'));
      });
    });
  });


  describe('processCode', function () {
    var processed;
    var original = 'function foo() {\n  return \'bar\';\n}';

    it('process the code blocks', function () {
      expect(function () {
        processed = lib.processCode('js', original);
      }).not.to.throwError(err('processing code'));
    });

    describe('result', function () {
      it('has been highlighted', function () {
        expect(processed).to.match(new RegExp('<span class="hljs-title">foo</span>'));
      });
    });
  });



  describe('parseFile function', function () {
    var jsFile;
    var lessFile;


    it('parses a file', function () {
      expect(function () {
        jsFile = lib.parseFile(__dirname +'/example.js');
        lessFile = lib.parseFile(__dirname +'/example.less');
      }).not.to.throwError(err('parsing file'));
    });


    describe('result for a .js file', function () {
      it('is an array', function () {
        expect(jsFile).to.be.an('array');
        expect(jsFile.length).to.be.above(0);
        for (var b in jsFile) {
          var block = jsFile[b];
          expect(block.documentation).not.to.match(/not documentation block/);
        }
      });
    });


    describe('result for a .less file', function () {
      it('is an array', function () {
        expect(lessFile).to.be.an('array');
        expect(lessFile.length).to.be.above(0);
        for (var b in lessFile) {
          var block = lessFile[b];
          expect(block.documentation).not.to.match(/not documentation block/);
        }
      });
    });
  });

  describe('writeFileDocumentation function', function () {
    var tmpDir;
    before(function (done) {
      tmp.dir({
        unsafeCleanup: true
      }, function (err, dir) {
        if (err) {
          return done(err);
        }
        tmpDir = dir;
        done();
      });
    });


    it('write the documentation of a file', function () {
      expect(function () {
        lib.writeFileDocumentation(__dirname +'/example.js', tmpDir + '/written.html');
      }).not.to.throwError(err('writing docs'));
    });
  });


  describe('writeProjectDocumentation', function () {
    var tmpDir;
    before(function (done) {
      tmp.dir({
        unsafeCleanup: true
      }, function (err, dir) {
        if (err) {
          return done(err);
        }
        tmpDir = dir;
        done();
      });
    });


    it('write the documentation of a project', function () {
      expect(function () {
        lib.writeProjectDocumentation([
          'example.js',
          'example.less',
          'dir/example.html',
          'dir/sub/example.md'
        ], tmpDir, {
          cwd: __dirname

        });
      }).not.to.throwError(err('project documentation'));
    });

    describe('project documentation scaffolding', function () {
      xit('has an index', function () {
        expect(fs.existsSync(tmpDir + '/index.html')).to.be(true);
      });

      it('a `example.js.html` file', function () {
        expect(fs.existsSync(tmpDir + '/example.js.html')).to.be(true);
      });

      it('a `example.less.html`', function () {
        expect(fs.existsSync(tmpDir + '/example.less.html')).to.be(true);
      });

      it('a `dir/example.html.html` file', function () {
        expect(fs.existsSync(tmpDir + '/dir/example.html.html')).to.be(true);
      });

      it('a `dir/sub/example.md.html` file', function () {
        expect(fs.existsSync(tmpDir + '/dir/sub/example.md.html')).to.be(true);
      });

      it('a `assets/styles/styles.css` file', function () {
        expect(fs.existsSync(tmpDir + '/assets/styles/styles.css')).to.be(true);
      });

      it('a `assets/scripts/scripts.js` file', function () {
        expect(fs.existsSync(tmpDir + '/assets/scripts/scripts.js')).to.be(true);
      });

      xit('a `assets/favicon.ico` file', function () {
        expect(fs.existsSync(tmpDir + '/assets/favicon.ico')).to.be(true);
      });
    });
  });
});
