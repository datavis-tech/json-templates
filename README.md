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

We wanted the ability to make any of the string values parameterizable. 


## Related Work

 * [json-templater](https://www.npmjs.com/package/json-templater)
 * [bodybuilder](https://github.com/danpaz/bodybuilder)
 * [elasticsearch-query-builder](https://github.com/leonardw/elasticsearch-query-builder)
