var assert = require("assert");
var parse = require("./index");

describe("json-template", function() {

  it("should compute template for a string with a single parameter", function() {
    var template = parse("{{foo}}");
    assert.equal(template({ foo: "bar" }), "bar");
    assert.deepEqual(template.parameters, [{ key: "foo" }]);
  });

  it("should compute template for strings with no parameters", function() {
    [
      "foo",
      "{{}}",
      "}}{{",
      "}}foo{{"
    ].forEach(function (value){
      var template = parse(value);
      assert.equal(template(), value);
      assert.deepEqual(template.parameters, []);
    });
  });

  it("should compute template with default for a string", function() {
    var template = parse("{{foo:bar}}");
    assert.equal(template(), "bar");
    assert.equal(template({ foo: "baz" }), "baz");
    assert.equal(template({ unknownParam: "baz" }), "bar");
    assert.deepEqual(template.parameters, [
      {
        key: "foo",
        defaultValue: "bar"
      }
    ]);
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


