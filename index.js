// json-templates
// Simple templating within JSON structures.
//
// By Curran Kelleher and Chrostophe Serafin
// November 2016

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
  var regex = /{{(\w+)(:?(.*))+}}/i;

  return function (str){
    if(regex.test(str)){
      var match = str.match(regex),
          parameter = Parameter(match);
      return Template(function (context){
        if(typeof context === "undefined"){
          context = {};
        }
        return str.replace(match[0], context[parameter.key] || parameter.defaultValue);
      }, [parameter]);
    } else {
      return Template(function (){
        return str;
      }, []);
    }
  };
}());


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


// Constructs a parameter object from a match result.
// e.g. "['{{foo}}','foo','','',index:0,input:'{{foo}}']" --> { key: "foo" }
// e.g. "['{{foo:bar}}','foo',':bar','bar',index:0,input:'{{foo:bar}}']" --> { key: "foo", defaultValue: "bar" }
function Parameter(match){
  var parameter = { key: match[1] };

  if(match[3] && match[3].length > 0) {
    parameter.defaultValue = match[3];
  }

  return parameter;
}


// Constructs a template function with `parameters` property.
function Template(fn, parameters){
  fn.parameters = parameters;
  return fn;
}
