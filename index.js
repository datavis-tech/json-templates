module.exports = function parse(value){
  if(isTemplateString(value)){
    var parameter = Parameter(value);

    return Template(function (context){
      if(typeof context === "undefined"){
        context = {};
      }
      return context[parameter.key] || parameter.defaultValue;
    }, [parameter]);

  } else {

    return Template(function (){
      return value;
    }, []);

  }
};

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

  // Extract the key.
  var parameter = {
    key: str.substring(2, str.length - 2)
  };

  // Handle default values.
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
