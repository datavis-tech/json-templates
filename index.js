// json-templates
// Simple templating within JSON structures.
//
// By Curran Kelleher and Chrostophe Serafin
// November 2016
var objectPath = require("object-path");

module.exports = parse;


// Parses the given template object.
//
// Returns a function `template(context)` that will "fill in" the template
// with the context object passed to it.
//
// The returned function has a `parameters` property,
// which is an array of parameter descriptor objects,
// each of which has a `key` property and possibly a `defaultValue` property.
function parse(value){
  switch(type(value)) {
    case "string":
      return parseString(value);
    case "object":
      return parseObject(value);
    case "array":
      return parseArray(value);
    default:
      return Template(function (){ return value; }, []);
  }
};


// An enhanced version of `typeof` that handles arrays and dates as well.
function type(value){
  return (
    Array.isArray(value) ? "array" :
    value instanceof Date ? "date" :
    typeof value
  );
}


// Parses leaf nodes of the template object that are strings.
// Also used for parsing keys that contain templates.
var parseString = (function (){

  // This regular expression detects instances of the
  // template parameter syntax such as {{foo}} or {{foo:someDefault}}.
  var regex = /{{(\w|:|\s|-|\.|@)+}}/g;

  return function (str){
    if(regex.test(str)){

      var matches = str.match(regex),
          parameters = matches.map(Parameter);

      return Template(function (context){
        context = context || {};
        return matches.reduce(function (str, match, i){
          var parameter = parameters[i];
          var value = objectPath.get(context, parameter.key) || parameter.defaultValue;
          return str.replace(match, value);
        }, str);
      }, parameters);

    } else {
      return Template(function (){
        return str;
      }, []);
    }
  };
}());


// Constructs a parameter object from a match result.
// e.g. "['{{foo}}']" --> { key: "foo" }
// e.g. "['{{foo:bar}}']" --> { key: "foo", defaultValue: "bar" }
function Parameter(match){
  match = match.substr(2, match.length - 4).trim();
  var i = match.indexOf(":");
  if(i !== -1){
    return {
      key: match.substr(0, i),
      defaultValue: match.substr(i + 1)
    };
  } else {
    return { key: match };
  }
}


// Constructs a template function with `parameters` property.
function Template(fn, parameters){
  fn.parameters = parameters;
  return fn;
}


// Parses non-leaf-nodes in the template object that are objects.
function parseObject(object){

  var children = Object.keys(object).map(function (key){
    return {
      keyTemplate: parseString(key),
      valueTemplate: parse(object[key])
    };
  });

  return Template(function (context){
    return children.reduce(function (newObject, child){
      newObject[child.keyTemplate(context)] = child.valueTemplate(context);
      return newObject;
    }, {});
  }, children.reduce(function (parameters, child){
      return parameters.concat(child.valueTemplate.parameters, child.keyTemplate.parameters);
  }, []));

}


// Parses non-leaf-nodes in the template object that are arrays.
function parseArray(array){

  var templates = array.map(parse);

  return Template(function (context){
    return templates.map(function (template){
      return template(context);
    });
  }, templates.reduce(function (parameters, template){
    return parameters.concat(template.parameters);
  }, []));

}
