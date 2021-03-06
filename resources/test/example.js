/**
 * block comment, not documentation block
 */

/*
block comment, not documentation block
*/

function () { // not documentation block
  var self = this;
}

// first documentation comes after first code and has only 1 line
var example = 'string';

// second documentation block has a code example and utilizes markdown notation
// ```js
// function foo() {
//   return 'bar';
// }
// ```
// and so on
//
// Should be in the same block

var arr = [
  'always', // not documentation block
  'on',
  'a',
  'new',
  'line'
];
