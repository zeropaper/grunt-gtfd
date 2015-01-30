# grunt-gtfd

A [grunt](http://gruntjs.com) task to _generate the fine documentation_.

## Aim and goals

[Docco](//github.com/jashkenas/docco) is a great tool and at first I thought I could use it to document a project with several files (sometimes in sub-directories).
But it didn't worked out the way I wanted and was difficult to theme (for me) as well.
I thought about forking it. But it is written in CoffeeScript, I could not find the tests... and so on. So I started with a similar idea.

## Features

- __Static__: you can zip and share or serve the result as-is.
- __Simple__: just like Docco
- __Directories__: are not an issue

## Usage

You probably should have a look at the [Gruntfile.js](./Gruntfile.js#gtfd-task).

## The fine documentation

If you do not have [grunt](http://gruntjs.com) installed globally `npm run-script docs` otherwise `grunt` will generate the documentation in a `docs` directory.


## Test

Without [grunt](http://gruntjs.com) globally installed `npm test` otherwise `grunt mochacli`.


## Development

Without [grunt](http://gruntjs.com) globally installed
```sh
npm -g install grunt-cli
echo "sersiously?"
grunt dev-server
```

## License

[MIT](LICENSE)
