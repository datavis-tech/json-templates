// These are the unit tests for the library.
// Run them with the command `npm test`.
// By Curran Kelleher
// September 2016

// tests for duplication/deduplication added by Paul Brewer, Economic & Financial Technology Consulting LLC, Dec 2017

const assert = require('assert');
const parse = require('./dist');

describe('json-template', () => {
  // Handling of strings is the most critical part of the functionality.
  // This section tests the string templating functionality,
  // including default values and edge cases.
  describe('strings', () => {
    it('should compute template for a string with a single parameter', () => {
      const template = parse('{{foo}}');
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.equal(template({ foo: 'bar' }), 'bar');
    });

    it('should compute template for a string with a nested object parameter', () => {
      const template = parse('{{foo.value:baz}}');
      assert.deepEqual(template.parameters, [{ key: 'foo.value', defaultValue: 'baz' }]);
      assert.equal(template({ foo: { value: 'bar' } }), 'bar');
      assert.equal(template(), 'baz');
    });

    it('should compute template for strings with no parameters', () => {
      ['foo', '{{}}', '}}{{', '}}foo{{'].forEach(function(value) {
        const template = parse(value);
        assert.deepEqual(template.parameters, []);
        assert.equal(template(), value);
      });
    });

    it('should compute template with default for a string', () => {
      const template = parse('{{foo:bar}}');
      assert.deepEqual(template.parameters, [
        {
          key: 'foo',
          defaultValue: 'bar'
        }
      ]);
      assert.equal(template(), 'bar');
      assert.equal(template({ foo: 'baz' }), 'baz');
      assert.equal(template({ unknownParam: 'baz' }), 'bar');
    });

    it('should compute template with default for a string with multiple colons', () => {
      const template = parse('{{foo:bar:baz}}');
      assert.deepEqual(template.parameters, [
        {
          key: 'foo',
          defaultValue: 'bar:baz'
        }
      ]);
      assert.equal(template(), 'bar:baz');
      assert.equal(template({ foo: 'baz' }), 'baz');
      assert.equal(template({ unknownParam: 'baz' }), 'bar:baz');
    });

    it('should compute template for a string with inner parameter', () => {
      const template = parse('Hello {{foo}}, how are you ?');
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.equal(template({ foo: 'john' }), 'Hello john, how are you ?');
    });

    it('should compute template for a string with multiple inner parameters', () => {
      const template = parse('Hello {{firstName}} {{lastName}}, how are you ?');
      assert.deepEqual(template.parameters, [{ key: 'firstName' }, { key: 'lastName' }]);
      assert.equal(
        template({ firstName: 'Jane', lastName: 'Doe' }),
        'Hello Jane Doe, how are you ?'
      );
    });

    it('should handle extra whitespace', () => {
      const template = parse('Hello {{firstName }} {{ lastName}}, how are you ?');
      assert.deepEqual(template.parameters, [{ key: 'firstName' }, { key: 'lastName' }]);
      assert.equal(
        template({ firstName: 'Jane', lastName: 'Doe' }),
        'Hello Jane Doe, how are you ?'
      );
    });

    it('should handle dashes in defaults', () => {
      const template = parse('{{startTime:now-24h}}');
      assert.deepEqual(template.parameters, [{ key: 'startTime', defaultValue: 'now-24h' }]);
      assert.equal(template({ startTime: 'now-48h' }), 'now-48h');
      assert.equal(template(), 'now-24h');
    });

    it('should handle special characters in defaults', () => {
      const template = parse('{{foo:-+., @/()?=*_}}');
      assert.deepEqual(template.parameters, [{ key: 'foo', defaultValue: '-+., @/()?=*_' }]);
      assert.equal(template({ foo: '-+., @/()?=*_' }), '-+., @/()?=*_');
      assert.equal(template(), '-+., @/()?=*_');
    });

    it('should handle email address in defaults', () => {
      const template = parse('{{email:jdoe@mail.com}}');
      assert.deepEqual(template.parameters, [{ key: 'email', defaultValue: 'jdoe@mail.com' }]);
      assert.equal(template({ email: 'jdoe@mail.com' }), 'jdoe@mail.com');
      assert.equal(template(), 'jdoe@mail.com');
    });

    it('should handle phone number in defaults', () => {
      const template = parse('{{phone:+1 (256) 34-34-4556}}');
      assert.deepEqual(template.parameters, [
        { key: 'phone', defaultValue: '+1 (256) 34-34-4556' }
      ]);
      assert.equal(template({ phone: '+1 (256) 34-34-4556' }), '+1 (256) 34-34-4556');
      assert.equal(template(), '+1 (256) 34-34-4556');
    });

    it('should handle url in defaults', () => {
      const template = parse('{{url:http://www.host.com/path?key_1=value}}');
      assert.deepEqual(template.parameters, [
        { key: 'url', defaultValue: 'http://www.host.com/path?key_1=value' }
      ]);
      assert.equal(
        template({ url: 'http://www.host.com/path?key_1=value' }),
        'http://www.host.com/path?key_1=value'
      );
      assert.equal(template(), 'http://www.host.com/path?key_1=value');
    });

    it('should handle empty strings for parameter value', () => {
      const template = parse('{{foo}}');
      assert.equal(template({ foo: '' }), '');
    });
  });

  // This section tests that the parse function recursively
  // traverses objects, and applies the string templating correctly.
  describe('objects', () => {
    it('should compute template with an object that has inner parameter', () => {
      const template = parse({ title: 'Hello {{foo}}, how are you ?' });
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.deepEqual(template({ foo: 'john' }), { title: 'Hello john, how are you ?' });
    });

    it('should compute template with an object', () => {
      const template = parse({ title: '{{foo}}' });
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.deepEqual(template({ foo: 'bar' }), { title: 'bar' });
    });

    it('should use a number as a value', () => {
      const template = parse({ title: '{{foo}}' });
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.deepEqual(JSON.stringify(template({ foo: 5 })), '{"title":5}');
    });

    it('should use a $ symbol in a name', () => {
      const template = parse({ title: '{{$foo}}' });
      assert.deepEqual(template.parameters, [{ key: '$foo' }]);
      assert.deepEqual(template({ $foo: 'bar' }), { title: 'bar' });
    });

    it('should compute template with an object with multiple parameters', () => {
      const template = parse({
        title: '{{myTitle}}',
        description: '{{myDescription}}'
      });

      assert.deepEqual(template.parameters, [{ key: 'myTitle' }, { key: 'myDescription' }]);

      assert.deepEqual(
        template({
          myTitle: 'foo',
          myDescription: 'bar'
        }),
        {
          title: 'foo',
          description: 'bar'
        }
      );
    });

    it('should compute template for an object with a nested object parameter', () => {
      const template = parse({ a: '{{foo.1:baz}}' });
      assert.deepEqual(template.parameters, [{ key: 'foo.1', defaultValue: 'baz' }]);
      assert.deepEqual(template({ foo: ['baq', 'bar'] }), { a: 'bar' });
      assert.deepEqual(template(), { a: 'baz' });
    });

    it('should compute template with nested objects', () => {
      const template = parse({
        body: {
          title: '{{foo}}'
        }
      });

      assert.deepEqual(template.parameters, [{ key: 'foo' }]);

      assert.deepEqual(template({ foo: 'bar' }), {
        body: {
          title: 'bar'
        }
      });
    });

    it('should compute template keys', () => {
      const template = parse({
        body: {
          'A simple {{message}} to': '{{foo}}'
        }
      });

      assert.deepEqual(template.parameters, [{ key: 'foo' }, { key: 'message' }]);

      assert.deepEqual(template({ foo: 'bar', message: 'hello' }), {
        body: {
          'A simple hello to': 'bar'
        }
      });
    });

    describe('duplication and deduplication', () => {
      // tested: (i) duplication: if a template uses {{project}} twice, is it set consistently?
      //         (ii) deduplication: if a template uses {{project}} twice, does key:"project" appear only once in template.parameters ?
      // untested: what to do with {{param:default1}}, {{param:default2}}, and/or {{param}}  in the same template?  is this invalid? do we throw an error?

      const template = parse({
        disk: '/project/{{project}}/region/{{region}}/ssd',
        vm: '/project/{{project}}/region/{{region}}/cpu'
      });

      it('should correctly fill duplicate references in a template', () => {
        assert.deepEqual(template({ project: 'alpha', region: 'us-central' }), {
          disk: '/project/alpha/region/us-central/ssd',
          vm: '/project/alpha/region/us-central/cpu'
        });
      });

      it('should deduplicate template parameters', () => {
        assert.deepEqual(template.parameters, [{ key: 'project' }, { key: 'region' }]);
      });
    });

    it('should compute template keys with default value', () => {
      const template = parse({
        body: {
          'A simple {{message:hello}} to': '{{foo}}'
        }
      });

      assert.deepEqual(template.parameters, [
        { key: 'foo' },
        { key: 'message', defaultValue: 'hello' }
      ]);

      assert.deepEqual(template({ foo: 'bar' }), {
        body: {
          'A simple hello to': 'bar'
        }
      });
    });

    it('should compute template keys with default value and period in the string', () => {
      const template = parse({
        body: {
          'A simple {{message:hello.foo}} to': '{{foo}}'
        }
      });

      assert.deepEqual(template.parameters, [
        { key: 'foo' },
        { key: 'message', defaultValue: 'hello.foo' }
      ]);

      assert.deepEqual(template({ foo: 'bar' }), {
        body: {
          'A simple hello.foo to': 'bar'
        }
      });
    });

    it('should allow template with null leaf values', () => {
      const spec = {
        x: '{{foo}}',
        y: null
      };
      const template = parse(spec);
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.deepEqual(template({ foo: 'bar' }), { x: 'bar', y: null });
    });
  });

  // This section tests that the parse function recursively
  // traverses arrays, and applies the string templating correctly.
  describe('arrays', () => {
    it('should compute template with an array', () => {
      const template = parse(['{{foo}}']);
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.equal(JSON.stringify(template({ foo: 'bar' })), '["bar"]');
    });

    it('should compute template with a nested array', () => {
      const template = parse([['{{foo}}']]);
      assert.deepEqual(template.parameters, [{ key: 'foo' }]);
      assert.equal(JSON.stringify(template({ foo: 'bar' })), '[["bar"]]');
    });
  });

  // This section tests that the parse function applies the templating
  // on string with function
  describe('function', () => {
    it('should compute template with function', () => {
      const template = parse(['{{userCard}}']);
      assert.deepEqual(template.parameters, [{ key: 'userCard' }]);
      assert.deepEqual(template({ userCard: () => ({ id: 1, user: "John" }) }), [{ id: 1, user: "John" }]);
    });

    it('should compute template with function with multiple inner parameters', () => {
      const template = parse(JSON.stringify({ username: "{{username}}", password: "{{password}}" }));
      assert.deepEqual(template.parameters, [{ key: 'username' }, { key: 'password' }]);
      assert.equal(template({ username: () => ("John"), password: () => ("John") }), '{"username":"John","password":"John"}');
    });
  });

  // This section tests that arbitrary types may be present
  // as leaf nodes of the object tree, and they are handled correctly.
  describe('unknown types', () => {
    it('should compute template with numbers', () => {
      const template = parse(1);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), 1);
    });

    it('should compute template with booleans', () => {
      const template = parse(true);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), true);
    });

    it('should compute template with dates', () => {
      const value = new Date();
      const template = parse(value);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), value);
    });

    it('should compute template with functions', () => {
      const value = () => {
        return 'foo';
      };
      const template = parse(value);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), value);
    });
  });

  // This section tests for our main use case of this library - ElasticSearch queries.
  // These examples demonstrate that the templating works for complex object structures
  // that we will encounter when using the templating functionality with ElasticSearch.
  describe('mixed data structures', () => {
    it('should compute template with ElasticSearch query', () => {
      // Query example from https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search
      const template = parse({
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
      });

      assert.deepEqual(template.parameters, [{ key: 'title' }]);

      assert.deepEqual(template({ title: 'test' }), {
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
      });
    });

    it('should compute template with ElasticSearch query including default value', () => {
      const template = parse({
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
      });

      assert.deepEqual(template.parameters, [
        {
          key: 'title',
          defaultValue: 'test'
        }
      ]);

      assert.deepEqual(template(), {
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
      });

      assert.deepEqual(template({ title: 'foo' }), {
        index: 'myindex',
        body: {
          query: {
            match: {
              title: 'foo'
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
      });
    });

    it('should compute template with ElasticSearch query including arrays', () => {
      // Query example from https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
      const template = parse({
        bool: {
          must: {
            term: {
              user: 'kimchy'
            }
          },
          filter: {
            term: {
              tag: 'tech'
            }
          },
          must_not: {
            range: {
              age: {
                from: 10,
                to: 20
              }
            }
          },
          should: [
            {
              term: {
                tag: '{{myTag1}}'
              }
            },
            {
              term: {
                tag: '{{myTag2}}'
              }
            }
          ],
          minimum_should_match: 1,
          boost: 1
        }
      });

      assert.deepEqual(template.parameters, [{ key: 'myTag1' }, { key: 'myTag2' }]);

      assert.deepEqual(
        template({
          myTag1: 'wow',
          myTag2: 'cats'
        }),
        {
          bool: {
            must: {
              term: {
                user: 'kimchy'
              }
            },
            filter: {
              term: {
                tag: 'tech'
              }
            },
            must_not: {
              range: {
                age: {
                  from: 10,
                  to: 20
                }
              }
            },
            should: [
              {
                term: {
                  tag: 'wow'
                }
              },
              {
                term: {
                  tag: 'cats'
                }
              }
            ],
            minimum_should_match: 1,
            boost: 1
          }
        }
      );
    });
  });

  // This section tests that the parse function is capable to replace simple strings, objects and arrays
  describe('Replacement functionality', () => {
    it('should replace object without stringify', () => {
      const template = parse({
        s: '1',
        b: '{{c.d}}'
      });
      const context = {
        c: {
          d: {
            j: 'a'
          }
        }
      };
      const expected = {
        s: '1',
        b: {
          j: 'a'
        }
      };
      assert.deepEqual(template.parameters, [{ key: 'c.d' }]);
      assert.equal(JSON.stringify(template(context)), JSON.stringify(expected));
    });

    it('should replace array without stringify', () => {
      const template = parse({
        s: '1',
        b: '{{c.d}}'
      });
      const context = {
        c: {
          d: ['a', 'b', 'c']
        }
      };
      const expected = {
        s: '1',
        b: ['a', 'b', 'c']
      };
      assert.deepEqual(template.parameters, [{ key: 'c.d' }]);
      assert.equal(JSON.stringify(template(context)), JSON.stringify(expected));
    });
  });

  // This section tests that if the match is not found the template should be replaced by null
  describe('no match on the given context', () => {
    it('should replace the given template by null if no match found for an string', () => {
      const template = parse('{{foo}}');
      assert.equal(template({}), null);
    });

    it('should replace the given template by null if no match found for an object', () => {
      const template = parse({ boo: '{{foo}}' });
      assert.deepEqual(template({}), { boo: null });
    });

    it('should replace the given template by null if the found value is null', () => {
      const template = parse({ boo: '{{foo}}' });
      assert.deepEqual(template({ foo: null }), { boo: null });
    });

    it('should handle multi-value expressions where the first value is null, but has a defaultValue', () => {
      const template = parse({ boo: '{{foo.isNull:defaultValue}} {{foo.isNonNull}}' });
      assert.deepEqual(template({ foo: { isNull: null, isNonNull: 'value' } }), { boo: 'defaultValue value' });
    });
  });
});
