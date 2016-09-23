# json-template

Simple JSON value templating.

## Usage

Here's how you can use this library. Begin by installing via NPM:

`npm install json-templates`

Here's a small example of usage showing the simplest case, a single string.

```js
var parse = require("json-templates");

var template = parse("{{foo}}");

console.log(template.parameters); // Prints [{ key: "foo" }]

console.log(template({ foo: "bar" })); // Prints "bar"
```

Parameters can have default values, specified using a colon.

```js
var template = parse("{{foo:bar}}");

console.log(template.parameters); // Prints [{ key: "foo", defaultValue: "bar" }]

console.log(template()); // Prints "bar", using the default value.

console.log(template({ foo: "baz" })); // Prints "baz", using the given value.
```

The kind of templating you can see in the above examples gets applied to any string values in complex object structures such as ElasticSearch queries. Here's an example of an ElasticSearch query.

```js
var template = parse({
  index: "myindex",
  body: {
    query: {
      match: {
        title: "{{myTitle}}"
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
});

console.log(template.parameters); // Prints [{ key: "myTitle" }]

console.log(template({ title: "test" }));
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

The parse function also handles nested arrays and arbitrary leaf values. For more detailed examples, check out the [tests](https://github.com/curran/json-templates/blob/master/test.js).


## Why?

The use case for this came about while working with ElasticSearch queries that need to be parameterized. As an example, consider the following ElasticSearch query (from the [ElasticSearch.js Documentation](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search):

```
{
  index: 'myindex',
  body: {
    query: {
      match: {
        title: 'test'
      }
    },
    facets: {
      tags: {
        terms: {
          field: 'tags'
        }
      }
    }
  }
}
```

We wanted the ability to speficy query templates within JSON files, and also make any of the string values parameterizable. The ideas was to make something kind of like [Handlebars](http://handlebarsjs.com/), but just for the values within the query. For example, here's what the above query template would look like with a parameterizable title:

```
{
  index: 'myindex',
  body: {
    query: {
      match: {
        title: '{{title}}'
      }
    },
    facets: {
      tags: {
        terms: {
          field: 'tags'
        }
      }
    }
  }
}
```

We also needed to know which parameters are required to "fill in" a given query template (in order to check if we have the right context parameters to actually execute the query). Related to this requirement, sometimes certain parameters should have default values. These parameters are not strictly required from the context. If not specified, the default value from the template will be used, otherwise the value from the context will be used. Here's how the above `title` parameter could have a default value of `test`:

```
{
  index: 'myindex',
  body: {
    query: {
      match: {
        title: '{{title:test}}'
      }
    },
    facets: {
      tags: {
        terms: {
          field: 'tags'
        }
      }
    }
  }
}
```

## Related Work

 * [json-templater](https://www.npmjs.com/package/json-templater)
 * [bodybuilder](https://github.com/danpaz/bodybuilder)
 * [elasticsearch-query-builder](https://github.com/leonardw/elasticsearch-query-builder)
