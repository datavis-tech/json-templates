module.exports = function parse(value){
  if(isTemplateString(value)){
    var key = templateStringKey(value);
    var template = function (context){
      return context[key];
    };
    template.parameters = [{ key: key }];
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

function templateStringKey(str){
  return str.substring(2, str.length - 2);
}
