# json-template

Simple JSON value templating.

## Usage

Here's how you can use this library. Begin by installing via NPM:

`npm install json-templates`

Here's a small example of usage showing the simplest case, a single string.

```js
const parse = require('json-templates');

const template = parse('{{foo}}');

console.log(template.parameters); // Prints [{ key: "foo" }]

console.log(template({ foo: 'bar' })); // Prints "bar"
```

### Parameter Default Values

Parameters can have default values, specified using a colon. These come into play only when the parameter is `undefined`.

```js
const template = parse('{{foo:bar}}');

console.log(template.parameters); // Prints [{ key: "foo", defaultValue: "bar" }]

console.log(template()); // Prints "bar", using the default value.

console.log(template({ foo: 'baz' })); // Prints "baz", using the given value.
```

### Nested Objects and Arrays

Parameters can come from a nested object.

```js
const template = parse('{{foo.value:baz}}');

console.log(template.parameters); // Prints [{ key: "foo.value", defaultValue: "baz" }]

console.log(template()); // Prints "baz", using the default value.

console.log(template({ foo: { value: 'bar' } })); // Prints "bar", using the given value.

// Example with parameter coming from array
const template = parse({ a: '{{foo.1:baz}}' });

console.log(template.parameters); // Prints [{ key: "foo.1", defaultValue: "baz" }]

console.log(template()); // Prints { a: "baz" }, using the default value.

console.log(template({ foo: ['baq', 'bar'] })); // Prints { a: "bar" }, using the given value of array.
```

### Multiple Parameters in Strings

You can use multiple parameters in a single string, with or without text between them:

```js
const template = parse('{{foo}}{{bar}}'); // Adjacent parameters
console.log(template({ foo: 1, bar: 'a' })); // Prints "1a"

const template2 = parse('Hello {{firstName}} {{lastName}}!'); // With text between
console.log(template2({ firstName: 'John', lastName: 'Doe' })); // Prints "Hello John Doe!"
```

### Template Keys

You can use templates in object keys, not just values:

```js
const template = parse({
  'A simple {{message}} to': 'value',
});
console.log(template({ message: 'hello' })); // Prints { "A simple hello to": "value" }
```

### Special Characters in Parameter Names

The library supports several special characters in parameter names:

```js
// $ symbol can be used anywhere
const template1 = parse('{{$foo}}');
const template2 = parse('{{foo$}}');

// - symbol can be used anywhere except as first character
const template3 = parse('{{foo-bar}}'); // Works
const template4 = parse('{{-foo}}'); // Won't work
```

### Unicode Support

Parameter names can include Unicode characters:

```js
const template = parse('{{中文}}');
console.log(template({ 中文: 'value' })); // Prints "value"
```

### Function Values

Templates can handle functions as values:

```js
const template = parse('{{userCard}}');
console.log(
  template({
    userCard: () => ({ id: 1, user: 'John' }),
  }),
); // Prints { id: 1, user: 'John' }
```

### Date Objects

The library has special handling for Date objects:

```js
const now = new Date();
const template1 = parse('{{now}}');
console.log(template1({ now })); // Preserves Date object

const template2 = parse('Created on {{now}}');
console.log(template2({ now })); // Converts to ISO string when part of a larger string
```

### Null and Undefined Handling

The library handles null and undefined values in specific ways:

```js
const template = parse('{{foo}} {{bar}}');

// undefined parameters without defaults become empty strings
console.log(template({ foo: undefined })); // Prints " "

// null parameters become empty strings when part of a larger string
console.log(template({ foo: null })); // Prints " "

// null values in templates are preserved
const template2 = parse({ key: null });
console.log(template2()); // Prints { key: null }
```

### Raw Key Option

By default, dot notation in parameter keys is interpreted as nested object access. You can change this with the rawKey option:

```js
const template = parse('{{foo.bar:baz}}', { rawKey: true });
// Now looks for a literal property named "foo.bar" instead of bar inside foo
console.log(template({ 'foo.bar': 'value' })); // Prints "value"
```

### Complex Example: ElasticSearch Query

The kind of templating you can see in the above examples gets applied to any string values in complex object structures such as ElasticSearch queries. Here's an example:

```js
const template = parse({
  index: 'myindex',
  body: {
    query: {
      match: {
        title: '{{myTitle}}',
      },
    },
    facets: {
      tags: {
        terms: {
          field: 'tags',
        },
      },
    },
  },
});

console.log(template.parameters); // Prints [{ key: "myTitle" }]

console.log(template({ title: 'test' }));
```

The last line prints the following structure:

```js
{
  index: "myindex",
  body: {
    query: {
      match: {
        title: "test"
      }
    },
    facets: {
      tags: {
        terms: {
          field: "tags"
        }
      }
    }
  }
}
```

## Why?

The use case for this came about while working with ElasticSearch queries that need to be parameterized. We wanted the ability to _specify query templates within JSON_, and also make any of the string values parameterizable. The idea was to make something kind of like [Handlebars](http://handlebarsjs.com/), but just for the values within the query.

We also needed to know which parameters are required to "fill in" a given query template (in order to check if we have the right context parameters to actually execute the query). Related to this requirement, sometimes certain parameters should have default values. These parameters are not strictly required from the context. If not specified, the default value from the template will be used, otherwise the value from the context will be used.

Here's how the above `title` parameter could have a default value of `test`:

```json
{
  "index": "myindex",
  "body": {
    "query": {
      "match": {
        "title": "{{title:test}}"
      }
    },
    "facets": {
      "tags": {
        "terms": {
          "field": "tags"
        }
      }
    }
  }
}
```

Also it was a fun challenge and a great opportunity to write some heady recursive functional code.

## Related Work

- [json-templater](https://www.npmjs.com/package/json-templater)
- [bodybuilder](https://github.com/danpaz/bodybuilder)
- [elasticsearch-query-builder](https://github.com/leonardw/elasticsearch-query-builder)
