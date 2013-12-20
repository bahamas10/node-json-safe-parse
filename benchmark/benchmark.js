var fs = require('fs');
var path = require('path');

var jsonsafeparse = require('../');

var TIMES = 1 * 1000 * 1000;

var s;

function run(func, name, times, s) {
  var start = Date.now();
  console.log('%s\t%dx', name, times);
  for (var i = 0; i < times; i++) {
    func(s);
  }
  var delta = Date.now() - start;
  console.log('=> took %d ms\n', delta);
  return delta;
}

function test(s) {
  console.log('testing with the following JSON');
  console.log(s);
  console.log();
  var delta1 = run(JSON.parse.bind(JSON), 'JSON.parse()', TIMES, s);
  var delta2 = run(jsonsafeparse, 'jsonsafeparse()', TIMES, s);
  console.log('===> jsonsafeparse was %d%% as fast as JSON.parse()\n',
      (delta1 / delta2 * 100).toFixed(2));
}

test('{"hasOwnProperty": 5, "x": "foo"}');

s = fs.readFileSync(path.join(__dirname, '..', 'example.json'), 'utf-8').trim();
test(s);
