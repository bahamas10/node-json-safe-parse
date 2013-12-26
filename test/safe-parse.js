var assert = require('assert');
var fs = require('fs');
var path = require('path');

var jsonsafeparse = require('../');

var s = fs.readFileSync(path.join(__dirname, '..', 'example.json'), 'utf-8');
var d;

console.log('ensuring jsonsafeparse(s) works as expected');
d = jsonsafeparse(s);

assert(d);
assert.strictEqual(typeof d, 'object');
assert.strictEqual(d.whois, 'John Galt?');
assert.strictEqual(d.missing, true);
assert.strictEqual(d.location, null);
assert(Array.isArray(d.employment));
assert.strictEqual(d.employment[0], '20th Century Motor Company');
assert.strictEqual(d.employment[1], 'Taggart Transcontinental');
assert(Array.isArray(d.education));
assert.strictEqual(typeof d.education[0], 'object');
assert.strictEqual(d.education[0].school, 'Patrick Henry University');
assert.strictEqual(d.education[0].years, 4);
assert(Array.isArray(d.education[0].majors));
assert.strictEqual(d.education[0].majors[0], 'physics');
assert.strictEqual(d.education[0].majors[1], 'philosophy');
console.log('done\n');

console.log('ensuring jsonsafeparse(s, \'throw\') throws');
assert.throws(function() {
  d = jsonsafeparse(s, 'throw');
});
console.log('done\n');

console.log('ensuring jsonsafeparse(s, \'ignore\') ignores keywords');
d = jsonsafeparse(s, 'ignore');
assert.strictEqual(typeof d.toString, 'function');
assert.strictEqual(typeof d.hasOwnProperty, 'function');
assert.strictEqual(typeof d.education[0].toString, 'function');
console.log('done\n');

console.log('ensuring jsonsafeparse(s, \'replace\') === JSON.parse(s)');
d = jsonsafeparse(s, 'replace');

assert.deepEqual(d, JSON.parse(s));
console.log('done\n');
