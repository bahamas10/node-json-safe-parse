JSON Safe Parse
===============

Parse JSON and silently ignore or error on reserved keys like hasOwnProperty,
toString, etc.

Installation
------------

    npm install json-safe-parse

Why?
----

`JSON.parse` is great, but it has one serious flaw in the context of JavaScript:
it allows you to override inherited properties.  This can become an issue if you
are parsing JSON from an untrusted source (eg: a user), and calling functions
on it you would expect to exist.

For example:

``` js
var s = '{"x": 5, "toString": "foo"}';
var d = JSON.parse(s);
console.log('%s', d);
```

Under normal circumstances, this would print `[object Object]`, as the `%s` given
to `console.log` (which is passed to `util.format`) calls the `toString` method
of the object given and substitutes in the data returned.

However, because `toString` was overridden to be a string, it is now an error to
call `toString`, as it is no longer callable.  Running this code results in:

```
TypeError: Cannot convert object to primitive value
    at String (<anonymous>)
    at util.js:39:25
    at String.replace (native)
    at Console.exports.format (util.js:35:23)
    at Console.log (console.js:53:34)
    at repl:1:9
    at REPLServer.self.eval (repl.js:110:21)
    at repl.js:249:20
    at REPLServer.self.eval (repl.js:122:7)
    at Interface.<anonymous> (repl.js:239:12)
```

Take another example that mimics what you might see in a real-world node
server, and imagine the JSON being parsed was sent by a user being nefarious.

``` js
var s = '{"id": 5, "hasOwnProperty": "foo"}';
var d = JSON.parse(s);
if (!d.hasOwnProperty('id'))
  console.log('property "id" must be supplied');
```

The logic is innocent enough; the code is attempting to ensure that the
user supplied the `id` key in the data they sent.  However, because the
"user" has overridden the `hasOwnProperty` property, this results in:

```
TypeError: Property 'hasOwnProperty' of object #<Object> is not a function
    at repl:1:8
    at REPLServer.self.eval (repl.js:110:21)
    at repl.js:249:20
    at REPLServer.self.eval (repl.js:122:7)
    at Interface.<anonymous> (repl.js:239:12)
    at Interface.EventEmitter.emit (events.js:95:17)
    at Interface._onLine (readline.js:202:10)
    at Interface._line (readline.js:531:8)
    at Interface._ttyWrite (readline.js:760:14)
    at ReadStream.onkeypress (readline.js:99:10)
```

---

In both of the examples given above, fatal errors were thrown that were not caught,
which would result in the node program terminating.

How
---

This module is not a reimplementation of `JSON.parse`, in fact, this module uses
`JSON.parse`, and then "cleans up" any keywords that have been overridden.

More importantly, this module does not have a hardcoded list of reserved
keywords or inherited properties.  Instead, it looks inside an empty object
to figure out which keywords are inherited, and which are safe to use.  That
means this module will continue to work even if in the future it is decided
that more properties will be attached to the `Object` prototype and thus
made reserved.

I liked the way [JSON5-utils](https://github.com/rlidwka/json5-utils)
handled this problem, but I didn't want to have to use a separate JSON
parser just to get this functionality.

This module provides a safe mechanism for parsing JSON, without implementing or
recreating a JSON parser.

The object is cleansed using this module https://github.com/bahamas10/node-cleanse

Usage
-----

``` js
var jsonsafeparse = require('json-safe-parse');
```

`jsonsafeparse` has the same usage as `JSON.parse` and is fully backwards
compatible.

``` js
// works just like JSON.parse
jsonsafeparse('{"x": 5}') == {x: 5}
```

### `jsonsafeparse(string, behavior='ignore')`

- `behavior`: specifies what to do with reserved keys
  - `ignore`: (default) silently discard reserved keys
  - `throw`: throw an error at the first reserved key found
  - `replace`: do nothing, this makes this function effectively the same as `JSON.parse`


``` js
// works just like JSON.parse but ignores reserved keywords; ignore
// is the default behavior
jsonsafeparse('{"x": 5, "hasOwnProperty": "foo"}');
// => {x: 5}
jsonsafeparse('{"x": 5, "hasOwnProperty": "foo"}', 'ignore')
// => {x: 5}

// throw will cause a SyntaxError to be thrown
jsonsafeparse('{"x": 5, "hasOwnProperty": "foo"}', 'throw')
// => SyntaxError: reserved keyword "hasOwnProperty" found in object

// replace will make it act like JSON.parse (unsafe)
jsonsafeparse('{"x": 5, "hasOwnProperty": "foo"}', 'replace')
// => {x: 5, "hasOwnProperty": "foo"}
```

### `jsonsafeparse.cleanse(obj, behavior='ignore')`

The function found in https://github.com/bahamas10/node-cleanse

Same as above, but this function takes a JavaScript object (or array,
string, etc.) that has already been parsed.  The behavior can be `ignore`
or `throw` for the cleanse method; `replace` is only relevant for the
`jsonsafeparse` function.

This is useful for objects that have already been parsed for you,
such as the output of `querystring.parse`, `req.headers`, `process.env`, etc.

ie

``` js
// strip out any reserved keywords from the headers object
// .cleanse() returns a reference to the original object, as it
// is fixed inplace
req.headers = jsonsafeparse.cleanse(req.headers);
// same as
jsonsafeparse.cleanse(req.headers);

// strip out any reserved keywords from environmental variables
jsonsafeparse.cleanse(process.env);
```

Example
-------

The tool `examples/cli.js` in this repo is used to see what JSON
will look like after its reserved keys have been stripped

`example.json`

``` json
{
  "whois": "John Galt?",
  "toString": "a Prometheus who changed his mind",
  "hasOwnProperty": true,
  "missing": true,
  "location": null,
  "employment": [
    "20th Century Motor Company",
    "Taggart Transcontinental"
  ],
  "education": [
    {
      "school": "Patrick Henry University",
      "toString": "PHU",
      "years": 4,
      "majors": [
        "physics",
        "philosophy"
      ]
    }
  ]
}
```

    $ node ./examples/cli.js < example.json

results in:

``` json
{
  "whois": "John Galt?",
  "missing": true,
  "location": null,
  "employment": [
    "20th Century Motor Company",
    "Taggart Transcontinental"
  ],
  "education": [
    {
      "school": "Patrick Henry University",
      "years": 4,
      "majors": [
        "physics",
        "philosophy"
      ]
    }
  ]
}
```

Benchmarks
----------

On average, `jsonsafeparse` is half as fast as `JSON.parse`.

    $ node benchmark/benchmark.js
    testing with the following JSON
    {"hasOwnProperty": 5, "x": "foo"}

    JSON.parse()    1000000x
    => took 609 ms

    jsonsafeparse() 1000000x
    => took 1232 ms

    ===> jsonsafeparse was 49.43% as fast as JSON.parse()

    testing with the following JSON
    {
      "whois": "John Galt?",
      "toString": "a Prometheus who changed his mind",
      "hasOwnProperty": true,
      "missing": true,
      "location": null,
      "employment": [
        "20th Century Motor Company",
        "Taggart Transcontinental"
      ],
      "education": [
        {
          "school": "Patrick Henry University",
          "toString": "PHU",
          "years": 4,
          "majors": [
            "physics",
            "philosophy"
          ]
        }
      ]
    }

    JSON.parse()    1000000x
    => took 6875 ms

    jsonsafeparse() 1000000x
    => took 13340 ms

    ===> jsonsafeparse was 51.54% as fast as JSON.parse()

License
-------

MIT
