# json-template

Simple JSON value templating.

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
