const DEBUG = process.env.GRAFFITICODE_DEBUG === 'true' || false;
const assert = (function assert() {
  // If 'DEBUG' is false then 'assert' is a no-op.
  return !DEBUG ?
    () => { } :
    (test, str) => {
      if (str === undefined) {
        str = "failed!";
      }
      if (!val) {
        let err = new Error(str);
        throw err;
      }
    };
})();

function error(val, err) {
  // If 'val' is false then report 'err'.
  if (!val) {
    throw new Error(err);
  }
}

const messages = {};
function message(errorCode, args = []) {
  let str = messages[errorCode];
  if (args) {
    args.forEach(function (arg, i) {
      str = str.replace("%" + (i + 1), arg);
    });
  }
  return errorCode + ": " + str;
}

const reservedCodes = [];
function reserveCodeRange(first, last, moduleName) {
  assert(first <= last, "Invalid code range");
  let noConflict = reservedCodes.every(function (range) {
    return last < range.first || first > range.last;
  });
  assert(noConflict, "Conflicting request for error code range");
  reservedCodes.push({ first: first, last: last, name: moduleName });
}

function parseJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    console.log("ERROR parsing JSON: " + JSON.stringify(str));
    console.log(e.stack);
    return null;
  }
}

function setMetadataBuilds(data, build) {
  if (typeof data !== 'object' || data === null || data instanceof Array) {
    // We got nothing to hang the metadata on.
    return;
  }
  if (!data._) {
    data._ = {};
  }
  if (!data._.builds) {
    data._.builds = [];
  }
  if (!data._.builds.some(b => build.name === b.name)) {
    data._.builds.push(build);
  }
}

function getCompilerHost(lang, config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    return 'localhost';
  }
  if (config.hosts && config.hosts[lang]) {
    return config.hosts[lang];
  }
  return `${lang.toLowerCase()}.artcompiler.com`;
}

function getCompilerPort(lang, config) {
  config = config || global.config || {};
  if (config.useLocalCompiles) {
    return `5${lang.substring(1)}`;
  }
  if (config.ports && config.ports[lang]) {
    return config.ports[lang];
  }
  return '443';
}

function isNonEmptyString(str) {
  return ('string' === typeof (str) && 0 < str.length);
}

function isNonNullObject(obj) {
  return (typeof obj === 'object' && obj !== null);
}

function cleanAndTrimObj(str) {
  if (!str) {
    return str;
  }
  str = str.replace(new RegExp("'", "g"), "''");
  str = str.replace(new RegExp("\n", "g"), " ");
  while (str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while (str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

function cleanAndTrimSrc(str) {
  if (!str || typeof str !== "string") {
    return str;
  }
  str = str.replace(new RegExp("'", "g"), "''");
  while (str.charAt(0) === " ") {
    str = str.substring(1);
  }
  while (str.charAt(str.length - 1) === " ") {
    str = str.substring(0, str.length - 1);
  }
  return str;
}

// From http://javascript.about.com/library/blipconvert.htm
function dot2num(dot) {
  var d = dot.split('.');
  var n = ((((((+d[0]) * 256) + (+d[1])) * 256) + (+d[2])) * 256) + (+d[3]);
  if (isNaN(n)) {
    return 0;
  }
  return n;
}

function num2dot(num) {
  var d = num % 256;
  for (var i = 3; i > 0; i--) {
    num = Math.floor(num / 256);
    d = num % 256 + '.' + d;
  }
  return d;
}

function statusCodeFromErrors(errs) {
  if (!Array.isArray(errs)) {
    errs = [errs];
  }
  let statusCode;
  return errs.some(
    err => statusCode =
      err.statusCode
  ) && statusCode || 500;
}

function messageFromErrors(errs) {
  if (!Array.isArray(errs)) {
    errs = [errs];
  }
  let message;
  return errs.some(
    err => message =
      err.data && err.data.error ||
      err.data
  ) && message || "Internal error";
}

const INTERNAL_ERROR = {
  statusCode: 500,
  error: "Internal error",
};
function internalError(error) {
  return Object.assign(INTERNAL_ERROR, { error });
}

exports.getCompilerHost = getCompilerHost;
exports.getCompilerPort = getCompilerPort;
exports.setMetadataBuilds = setMetadataBuilds;
exports.isNonEmptyString = isNonEmptyString;
exports.isNonNullObject = isNonNullObject;
exports.parseJSON = parseJSON;
exports.cleanAndTrimObj = cleanAndTrimObj;
exports.cleanAndTrimSrc = cleanAndTrimSrc;
exports.dot2num = dot2num;
exports.num2dot = num2dot;
exports.error = error;
exports.statusCodeFromErrors = statusCodeFromErrors;
exports.messageFromErrors = messageFromErrors;
exports.internalError = internalError;
