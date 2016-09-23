module.exports = function parse(value){
  if(isTemplateString(value)){
    var parameter = parseTemplateString(value);

    var template = function (context){
      if(typeof context === "undefined"){
        context = {};
      }
      return context[parameter.key] || parameter.defaultValue;
    };
    template.parameters = [parameter];
    return template;

  } else {
    var template = function (context){
      return value;
    };
    template.parameters = [];
    return template;
  }
};

function isTemplateString(str){
  return (
      (str.length > 5)
    &&
      (str.substr(0, 2) === "{{")
    &&
      (str.substr(str.length - 2, 2) === "}}")
  );
}

function parseTemplateString(str){
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
