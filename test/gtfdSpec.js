var expect = require('expect.js');
var fs = require('fs');
var tmp = require('tmp');
var path = require('path');

var testCwd = path.resolve(__dirname, '../resources/test');

function err(label) {
  return function (error) {
    console.info(label, error.stack);
  }
}

describe('gtfd library', function () {
  var FilesCollection;
  var collection;
  var model;
  var tmpDir;
  var fileObjs;
  var filePaths = [
    'README.md',
    'example.js',
    'example.less',
    'dir/example.html',
    'dir/README.md',
    'dir/sub/example.md'
  ];



  before(function (done) {
    FilesCollection = require('./../lib');

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



  describe('.expand', function () {
    it('converts an array of strings into array of objects', function () {
      var obj;
      expect(function () {
        fileObjs = FilesCollection.expand(filePaths);
      }).not.to.throwError(err('expand'));

      expect(fileObjs).to.be.an('array');

      expect(fileObjs.length).to.be(6);
    });
  });

  describe('FilesCollection', function () {
    it('needs a "destination" option', function () {
      expect(function () {
        new FilesCollection(fileObjs, {
          cwd: testCwd,
        });
      }).to.throwError();

      expect(function () {
        collection = new FilesCollection(fileObjs, {
          cwd: testCwd,
          destination: tmpDir
        });
      }).not.to.throwError(err('initialization'));
    });


    it('has a "cwd" property', function () {
      expect(collection.cwd).not.to.be(undefined);

      expect(collection.cwd).to.be(testCwd);
    });


    it('has a "destination" property', function () {
      expect(collection.destination).not.to.be(undefined);
    });

    describe('index method', function () {
      var model;

      it('returns the "README.md" model by default', function () {
        expect(function () {
          model = collection.index();
        }).not.to.throwError(err('index'));

        expect(model.filepath).to.be('README.md');
      });
    });


    describe('FilesCollection.File', function () {
      before(function () {
        model = collection.get('example.js');
      });


      describe('.content', function () {
        it('has been fetched at initialization', function () {
          expect(model.content).to.be.a('string');
        });
      });


      describe('.blocks', function () {
        it('is a collection', function () {
          expect(model.blocks).not.to.be(undefined);

          expect(model.blocks.length).not.to.be(undefined)

          expect(model.blocks.length).to.be.above(0);

          expect(model.blocks.toJSON).to.be.a('function');
        });


        describe('model', function () {
          it('is a pair of code and documentation', function () {
            model.blocks.forEach(function (block) {
              expect(block.start).not.to.be(undefined);

              expect(block.codeStart).not.to.be(undefined);

              expect(block.end).not.to.be(undefined);

              expect(block.documentation).to.be.a('string');

              expect(block.code).to.be.a('string');
            });
          });
        });
      });
    });


    describe('FilesCollection.Directory', function () {
      var directory;
      before(function () {
        directory = collection.get('dir');
      });

      describe('index method', function () {
        var model;

        it('returns the "README.md" model by default', function () {
          expect(function () {
            model = directory.index();
          }).not.to.throwError(err('index'));

          expect(model.basename).to.be('README.md');
          expect(model.filepath).to.be('dir/README.md');
        });
      });
    });


    describe('rendering', function () {
      it('does not make problems', function () {
        expect(function () {
          collection.writeFiles();
        }).not.to.throwError(err('writing html'));
      });

      describe('project documentation scaffolding', function () {
        it('has a "index.html" file generated from "README.md"', function () {
          expect(fs.existsSync(tmpDir + '/index.html')).to.be(true);
        });

        it('has no "README.md.html" because it was used to generate "index.html"', function () {
          expect(fs.existsSync(tmpDir + '/README.md.html')).to.be(false);
        });

        it('has a "example.js.html" file', function () {
          expect(fs.existsSync(tmpDir + '/example.js.html')).to.be(true);
        });

        it('has a "example.less.html"', function () {
          expect(fs.existsSync(tmpDir + '/example.less.html')).to.be(true);
        });

        it('has a "dir/index.html" file generated from "dir/README.md"', function () {
          expect(fs.existsSync(tmpDir + '/dir/index.html')).to.be(true);
        });

        it('has no "dir.html"', function () {
          expect(fs.existsSync(tmpDir + '/dir.html')).to.be(false);
        });

        it('has no "dir/README.md.html" because it was used to generate "dir/index.html"', function () {
          expect(fs.existsSync(tmpDir + '/dir/README.md.html')).to.be(false);
        });

        it('has a "dir/example.html.html" file', function () {
          expect(fs.existsSync(tmpDir + '/dir/example.html.html')).to.be(true);
        });

        it('has a "dir/sub/example.md.html" file', function () {
          expect(fs.existsSync(tmpDir + '/dir/sub/example.md.html')).to.be(true);
        });

        it('has a "assets/styles/styles.css" file', function () {
          expect(fs.existsSync(tmpDir + '/assets/styles/styles.css')).to.be(true);
        });

        it('has a "assets/scripts/scripts.js" file', function () {
          expect(fs.existsSync(tmpDir + '/assets/scripts/scripts.js')).to.be(true);
        });

        it('has no "file.jst" file', function () {
          expect(fs.existsSync(tmpDir + '/file.jst')).to.be(false);
        });

        it('has no "navigation.jst" file', function () {
          expect(fs.existsSync(tmpDir + '/file.jst')).to.be(false);
        });

        it('has no "navigation-item.jst" file', function () {
          expect(fs.existsSync(tmpDir + '/file.jst')).to.be(false);
        });

        xit('has a "assets/favicon.ico" file', function () {
          expect(fs.existsSync(tmpDir + '/assets/favicon.ico')).to.be(true);
        });
      });
    });
  });
});
