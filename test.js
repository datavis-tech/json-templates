// These are the unit tests for the library.
// Run them with the command `npm test`.
// By Curran Kelleher
// September 2016

var assert = require("assert");
var parse = require("./index");

describe("json-template", function() {

  // Handling of strings is the most critical part of the functionality.
  // This section tests the string templating functionality,
  // including default values and edge cases.
  describe("strings", function() {

    it("should compute template for a string with a single parameter", function() {
      var template = parse("{{foo}}");
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.equal(template({ foo: "bar" }), "bar");
    });

    it("should compute template for strings with no parameters", function() {
      [
        "foo",
        "{{}}",
        "}}{{",
        "}}foo{{"
      ].forEach(function (value){
        var template = parse(value);
        assert.deepEqual(template.parameters, []);
        assert.equal(template(), value);
      });
    });

    it("should compute template with default for a string", function() {
      var template = parse("{{foo:bar}}");
      assert.deepEqual(template.parameters, [
        {
          key: "foo",
          defaultValue: "bar"
        }
      ]);
      assert.equal(template(), "bar");
      assert.equal(template({ foo: "baz" }), "baz");
      assert.equal(template({ unknownParam: "baz" }), "bar");
    });

    it("should compute template with default for a string with multiple colons", function() {
      var template = parse("{{foo:bar:baz}}");
      assert.deepEqual(template.parameters, [
        {
          key: "foo",
          defaultValue: "bar:baz"
        }
      ]);
      assert.equal(template(), "bar:baz");
      assert.equal(template({ foo: "baz" }), "baz");
      assert.equal(template({ unknownParam: "baz" }), "bar:baz");
    });

    it("should compute template for a string with inner parameter", function() {
      var template = parse("Hello {{foo}}, how are you ?");
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.equal(template({ foo: "john" }), "Hello john, how are you ?");
    });

    it("should compute template for a string with multiple inner parameters", function() {
      var template = parse("Hello {{firstName}} {{lastName}}, how are you ?");
      assert.deepEqual(template.parameters, [{ key: "firstName" }, { key: "lastName" }]);
      assert.equal(template({ firstName: "Jane", lastName: "Doe" }), "Hello Jane Doe, how are you ?");
    });

    it("should handle extra whitespace", function() {
      var template = parse("Hello {{firstName }} {{ lastName}}, how are you ?");
      assert.deepEqual(template.parameters, [{ key: "firstName" }, { key: "lastName" }]);
      assert.equal(template({ firstName: "Jane", lastName: "Doe" }), "Hello Jane Doe, how are you ?");
    });

    it("should handle dashes in defaults", function() {
      var template = parse("{{startTime:now-24h}}");
      assert.deepEqual(template.parameters, [{ key: "startTime", defaultValue: "now-24h" }]);
      assert.equal(template({ startTime: "now-48h"}), "now-48h");
      assert.equal(template(), "now-24h");
    });

    it("should handle 'at' symbol in defaults", function() {
      var template = parse("{{email:jdoe@mail.com}}");
      assert.deepEqual(template.parameters, [{ key: "email", defaultValue: "jdoe@mail.com" }]);
      assert.equal(template({ email: "jdoe@mail.com"}), "jdoe@mail.com");
      assert.equal(template(), "jdoe@mail.com");
    });

  });


  // This section tests that the parse function recursively
  // traverses objects, and applies the string templating correctly.
  describe("objects", function() {

    it("should compute template with an object that has inner parameter", function() {
      var template = parse({ title: "Hello {{foo}}, how are you ?" });
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.deepEqual(template({ foo: "john" }), { title: "Hello john, how are you ?" });
    });

    it("should compute template with an object", function() {
      var template = parse({ title: "{{foo}}" });
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.deepEqual(template({ foo: "bar" }), { title: "bar" });
    });

    it("should compute template with an object with multiple parameters", function() {

      var template = parse({
        title: "{{myTitle}}",
        description: "{{myDescription}}"
      });

      assert.deepEqual(template.parameters, [
        { key: "myTitle" },
        { key: "myDescription"}
      ]);

      assert.deepEqual(template({
        myTitle: "foo",
        myDescription: "bar"
      }), {
        title: "foo",
        description: "bar"
      });

    });

    it("should compute template with nested objects", function() {

      var template = parse({
        body: {
          title: "{{foo}}"
        }
      });

      assert.deepEqual(template.parameters, [
        { key: "foo" }
      ]);

      assert.deepEqual(template({ foo: "bar" }), {
        body: {
          title: "bar"
        }
      });

    });

    it("should compute template keys", function() {

      var template = parse({
        body: {
          "A simple {{message}} to": "{{foo}}"
        }
      });

      assert.deepEqual(template.parameters, [
        { key: "foo" },
        { key: "message"}
      ]);

      assert.deepEqual(template({ foo: "bar", message: "hello" }), {
        body: {
          "A simple hello to": "bar"
        }
      });
    });

    it("should compute template keys with default value", function() {

      var template = parse({
        body: {
          "A simple {{message:hello}} to": "{{foo}}"
        }
      });

      assert.deepEqual(template.parameters, [
        { key: "foo" },
        { key: "message", defaultValue: "hello"}
      ]);

      assert.deepEqual(template({ foo: "bar" }), {
        body: {
          "A simple hello to": "bar"
        }
      });
    });

    it("should compute template keys with default value and period in the string", function() {

      var template = parse({
        body: {
          "A simple {{message:hello.foo}} to": "{{foo}}"
        }
      });

      assert.deepEqual(template.parameters, [
        { key: "foo" },
        { key: "message", defaultValue: "hello.foo"}
      ]);

      assert.deepEqual(template({ foo: "bar" }), {
        body: {
          "A simple hello.foo to": "bar"
        }
      });
    });

  });


  // This section tests that the parse function recursively
  // traverses arrays, and applies the string templating correctly.
  describe("arrays", function() {

    it("should compute template with an array", function() {
      var template = parse(["{{foo}}"]);
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.equal(
        JSON.stringify(template({ foo: "bar" })),
        '["bar"]'
      );
    });

    it("should compute template with a nested array", function() {
      var template = parse([["{{foo}}"]]);
      assert.deepEqual(template.parameters, [{ key: "foo" }]);
      assert.equal(
        JSON.stringify(template({ foo: "bar" })),
        '[["bar"]]'
      );
    });

  });


  // This section tests that arbitrary types may be present
  // as leaf nodes of the object tree, and they are handled correctly.
  describe("unknown types", function() {

    it("should compute template with numbers", function() {
      var template = parse(1);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), 1);
    });

    it("should compute template with booleans", function() {
      var template = parse(true);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), true);
    });

    it("should compute template with dates", function() {
      var value = new Date();
      var template = parse(value);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), value);
    });

    it("should compute template with functions", function() {
      var value = function (){ return "foo"; };
      var template = parse(value);
      assert.deepEqual(template.parameters, []);
      assert.equal(template(), value);
    });

  });

  // This section tests for our main use case of this library - ElasticSearch queries.
  // These examples demonstrate that the templating works for complex object structures
  // that we will encounter when using the templating functionality with ElasticSearch.
  describe("mixed data structures", function() {

    it("should compute template with ElasticSearch query", function() {

      // Query example from https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-search
      var template = parse({
        index: "myindex",
        body: {
          query: {
            match: {
              title: "{{title}}"
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

      assert.deepEqual(template.parameters, [{ key: "title" }]);

      assert.deepEqual(
        template({ title: "test" }),
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
      );
    });

    it("should compute template with ElasticSearch query including default value", function() {

      var template = parse({
        index: "myindex",
        body: {
          query: {
            match: {
              title: "{{title:test}}"
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

      assert.deepEqual(template.parameters, [{
        key: "title",
        defaultValue: "test"
      }]);

      assert.deepEqual(
        template(),
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
      );

      assert.deepEqual(
        template({ title: "foo" }),
        {
          index: "myindex",
          body: {
            query: {
              match: {
                title: "foo"
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
      );
    });

    it("should compute template with ElasticSearch query including arrays", function() {

      // Query example from https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-bool-query.html
      var template = parse({
        "bool": {
          "must": {
            "term": {
              "user": "kimchy"
            }
          },
          "filter": {
            "term": {
              "tag": "tech"
            }
          },
          "must_not": {
            "range": {
              "age": {
                "from": 10,
                "to": 20
              }
            }
          },
          "should": [
            {
              "term": {
                "tag": "{{myTag1}}"
              }
            },
            {
              "term": {
                "tag": "{{myTag2}}"
              }
            }
          ],
          "minimum_should_match": 1,
          "boost": 1
        }
      });

      assert.deepEqual(template.parameters, [
        { key: "myTag1" },
        { key: "myTag2" }
      ]);

      assert.deepEqual(
        template({
          myTag1: "wow",
          myTag2: "cats",
        }),
        {
          "bool": {
            "must": {
              "term": {
                "user": "kimchy"
              }
            },
            "filter": {
              "term": {
                "tag": "tech"
              }
            },
            "must_not": {
              "range": {
                "age": {
                  "from": 10,
                  "to": 20
                }
              }
            },
            "should": [
              {
                "term": {
                  "tag": "wow"
                }
              },
              {
                "term": {
                  "tag": "cats"
                }
              }
            ],
            "minimum_should_match": 1,
            "boost": 1
          }
        }
      );

    });

  });
});
