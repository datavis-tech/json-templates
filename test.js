var assert = require("assert");
var parse = require("./index");

describe("json-template", function() {

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

  });


  describe("objects", function() {

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

  });

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
