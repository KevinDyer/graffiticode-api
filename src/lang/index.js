const bent = require("bent");
const { getConfig } = require("../config");
const { isNonEmptyString, getCompilerHost, getCompilerPort } = require("../util");

const { buildGetBaseUrlForLanguage } = require("./base-url");
const { buildCompile } = require("./compile");
const { buildGetAsset } = require("./get-asset");
const { buildPingLang } = require("./ping-lang");

const getBaseUrlForLanguage = buildGetBaseUrlForLanguage({
  isNonEmptyString,
  env: process.env,
  getConfig,
  getCompilerHost,
  getCompilerPort
});
const compile = buildCompile({ getBaseUrlForLanguage, bent });
const getAsset = buildGetAsset({ getBaseUrlForLanguage, bent });
const pingLang = buildPingLang({
  getBaseUrlForLanguage,
  bent,
  log: console.log
});

exports.getBaseUrlForLanguage = getBaseUrlForLanguage;
exports.compile = compile;
exports.getAsset = getAsset;
exports.pingLang = pingLang;
