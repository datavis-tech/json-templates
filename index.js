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

function type(value){
  return (
    Array.isArray(value) ? "array" : 
    value instanceof Date ? "date" : 
    typeof value
  );
}

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
