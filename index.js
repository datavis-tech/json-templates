// This file contains the implementation of the library.
// The only function exported is the `parse` function.
//
// By Curran Kelleher
// September 2016


// Parses the given template object.
// Returns a function `template(context)` that will "fill in" the template
// with the context bassed to it.
// The returned function has a `parameters` property,
// which is an array of parameter descriptor objects,
// each of which has a `key` property
// and possibly a `defaultValue` property.
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

// An enhanced version of `typeof` that
// handles arrays and dates as well.
function type(value){
  return (
    Array.isArray(value) ? "array" : 
    value instanceof Date ? "date" : 
    typeof value
  );
}

// Parses leaf nodes of the template object that are strings.
function parseString(str){
  if(isTemplateString(str)){
    var parameter = Parameter(str);
    return Template(function (context){
      if(typeof context === "undefined"){
        context = {};
      }
      return context[parameter.key] || parameter.defaultValue;
    }, [parameter]);
  } else {
    return Template(function (){
      return str;
    }, []);
  }
}

// Checks whether a given string fits the form {{xyz}}.
function isTemplateString(str){
  return (
      (str.length > 5)
    &&
      (str.substr(0, 2) === "{{")
    &&
      (str.substr(str.length - 2, 2) === "}}")
  );
}

// Constructs a parameter object from the given template string.
// e.g. "{{xyz}}" --> { key: "xyz" }
// e.g. "{{xyz:foo}}" --> { key: "xyz", defaultValue: "foo" }
function Parameter(str){

  var parameter = {
    key: str.substring(2, str.length - 2)
  };

  var colonIndex = parameter.key.indexOf(":"); 
  if(colonIndex !== -1){
    parameter.defaultValue = parameter.key.substr(colonIndex + 1);
    parameter.key = parameter.key.substr(0, colonIndex);
  }

  return parameter;
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
      key: key,
      template: parse(object[key])
    };
  });

  return Template(function (context){
    return children.reduce(function (newObject, child){
      newObject[child.key] = child.template(context);
      return newObject;
    }, {});
  }, children.reduce(function (parameters, child){
    return parameters.concat(child.template.parameters);
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

module.exports = parse;
