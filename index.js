(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  // json-templates
  // Simple templating within JSON structures.
  //
  // Created by Curran Kelleher and Chrostophe Serafin.
  // Contributions from Paul Brewer and Javier Blanco Martinez.
  var objectPath = require('object-path');
  var dedupe = require('dedupe');
  var regexBase = /{{(\w|:|[\s-+.,@/\//()?=*_])+}}/g;
  var regexLength = 2

  // An enhanced version of `typeof` that handles arrays and dates as well.
  function type(value) {
    var valueType = typeof value;
    if (Array.isArray(value)) {
      valueType = 'array';
    } else if (value instanceof Date) {
      valueType = 'date';
    } else if (value === null) {
      valueType = 'null';
    }

    return valueType;
  }

  // Constructs a parameter object from a match result.
  // e.g. "['{{foo}}']" --> { key: "foo" }
  // e.g. "['{{foo:bar}}']" --> { key: "foo", defaultValue: "bar" }
  function Parameter(match) {
    var param;
    var matchValue = match.substr(regexLength, match.length - (regexLength * 2)).trim();
    var i = matchValue.indexOf(':');
    if (i !== -1) {
      param = {
        key: matchValue.substr(0, i),
        defaultValue: matchValue.substr(i + 1)
      };
    } else {
      param = { key: matchValue };
    }

    return param;
  }

  // Constructs a template function with deduped `parameters` property.
  function Template(fn, parameters) {
    // Paul Brewer Dec 2017 add deduplication call, use only key property to eliminate
    Object.assign(fn, {
      parameters: dedupe(parameters, function (item) { return item.key; })
    });

    return fn;
  }

  // Parses the given template object.
  //
  // Returns a function `template(context)` that will "fill in" the template
  // with the context object passed to it.
  //
  // The returned function has a `parameters` property,
  // which is an array of parameter descriptor objects,
  // each of which has a `key` property and possibly a `defaultValue` property.
  function parse(value, params) {
    if(typeof(params) !== 'undefined')
    {
     if(typeof(params.regex) !== 'undefined') 
      regexBase = params.regex;
     if(typeof(params.regexLength) !== 'undefined') 
      regexLength = params.regexLength; 
    }

    switch (type(value)) {
      case 'string':
        return parseString(value);
      case 'object':
        return parseObject(value);
      case 'array':
        return parseArray(value);
      default:
        return Template(function() {
          return value;
        }, []);
    }
  }

  // Parses leaf nodes of the template object that are strings.
  // Also used for parsing keys that contain templates.
  var parseString = (function () {
    // This regular expression detects instances of the
    // template parameter syntax such as {{foo}} or {{foo:someDefault}}.
    return function (str) {
      var parameters = [];
      var templateFn = function () { return str; };
      if (regexBase.test(str)) {
        var matches = str.match(regexBase);
        parameters = matches.map(Parameter);
        templateFn = function (context) {
          context = context || {};
          return matches.reduce(function (str, match, i) {
            var parameter = parameters[i];
            var value = objectPath.get(context, parameter.key);
            if (value === undefined) {
              value = parameter.defaultValue;
            }

            if (typeof value === 'object') {
              return value;
            }

            if (value === undefined || value === null) {
              return null;
            }

            return str.replace(match, value);
          }, str);
        };
      }

      return Template(templateFn, parameters);
    };
  })();

  // Parses non-leaf-nodes in the template object that are objects.
  function parseObject(object) {
    var children = Object.keys(object).map(function (key) { return ({
      keyTemplate: parseString(key),
      valueTemplate: parse(object[key])
    }); });
    var templateParameters = children.reduce(
      function (parameters, child) { return parameters.concat(child.valueTemplate.parameters, child.keyTemplate.parameters); },
      []
    );
    var templateFn = function (context) {
      return children.reduce(function (newObject, child) {
        newObject[child.keyTemplate(context)] = child.valueTemplate(context);
        return newObject;
      }, {});
    };

    return Template(templateFn, templateParameters);
  }

  // Parses non-leaf-nodes in the template object that are arrays.
  function parseArray(array) {
    var templates = array.map(parse);
    var templateParameters = templates.reduce(
      function (parameters, template) { return parameters.concat(template.parameters); },
      []
    );
    var templateFn = function (context) { return templates.map(function (template) { return template(context); }); };

    return Template(templateFn, templateParameters);
  }

  module.exports = parse;

})));
