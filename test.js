var assert = require("assert");
var parse = require("./index");

describe("json-template", function() {
  it("should compute template for a string", function() {
    var template = parse("{{foo}}");
    assert.equal(template({ foo: "bar" }), "bar");
    assert.deepEqual(template.parameters, [{ key: "foo" }]);
  });
});

// "{{}}"
// "}}{{"
// "}}foo{{"

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


