var util = require('util');

var EMPTY_OBJECT = {};

module.exports = jsonsafeparse;
module.exports.fix = fix;

function jsonsafeparse(s, behavior) {
  var reviver;
  if (typeof behavior === 'function') {
    reviver = behavior;
    behavior = null;
  }
  behavior = behavior || 'ignore';

  var obj = JSON.parse(s, reviver);

  return fix(obj, behavior);
}

// recursively fix every element found in obj, and
// return the fixed obj
function fix(obj, behavior) {
  // do nothing for the 'replace'  behavior
  if (behavior === 'replace')
    return obj;

  var i;
  if (Array.isArray(obj)) {
    // fix every element in an array
    for (i in obj) {
      obj[i] = fix(obj[i], behavior);
    }
  } else if (typeof obj === 'object') {
    // fix every item in an object, checking to see if the item
    // is valid by comparing its existence to an empty object literal
    for (i in obj) {
      if (i in EMPTY_OBJECT) {
        // reserved keyword found, figure out what to do
        switch (behavior) {
          case 'throw':
            throw new SyntaxError(util.format('reserved keyword "%s" found in object', i));
            break;
          case 'ignore':
          default:
            delete obj[i];
            break;
        }
      } else {
        // not a reserved keyword, just fix it like normal
        obj[i] = fix(obj[i], behavior);
      }
    }
  }
  return obj;
}
