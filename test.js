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
});

// "{{}}"
// "}}{{"
// "}}foo{{"
// "{{foo:bar:baz}}"

//
//var template = parse({ "PersonName": "{{person}}" });
//expect(template.parameters).to.equal(
//  [
//    {
//      key: "person",
//      path: ["PersonName"]
//    }
//  ]
//);
//expect(template({ person: "Susanna" })).to.equal(
//  { "PersonName": "Susanna" }
//);
//
//{ "PersonName": "{{person:Bob}}" }
//
//[
//  {
//    key: "person",
//    defaultValue: "Bob",
//    path: ["PersonName"]
//  }
//]
//
//{ "gte": "{{startDate:now-24h}}" }
//{ "index": "{{index}}" }


