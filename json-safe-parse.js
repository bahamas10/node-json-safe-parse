var cleanse = require('cleanse');

module.exports = jsonsafeparse;
module.exports.cleanse = cleanse;

function jsonsafeparse(s, behavior) {
  var reviver;
  if (typeof behavior === 'function') {
    reviver = behavior;
    behavior = null;
  }
  behavior = behavior || 'ignore';

  var obj = JSON.parse(s, reviver);

  if (behavior === 'replace')
    return obj;

  return cleanse(obj, behavior);
}
