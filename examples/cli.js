#!/usr/bin/env node
var fs = require('fs');
var jsonsafeparse = require('../');
var s = fs.readFileSync('/dev/stdin', 'utf-8');
console.log(JSON.stringify(jsonsafeparse(s), null, 2));
