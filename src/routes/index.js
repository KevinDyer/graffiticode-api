const { Router } = require('express');

const { getConfig } = require('./../config');
const { pingLang, getAsset } = require('./../lang');
const { isNonEmptyString } = require('./../util');

const { buildConfigHandler } = require('./config');
const { buildLangRouter } = require('./lang');

const configHandler = buildConfigHandler({ getConfig });
const langRouter = buildLangRouter({
  newRouter: () => new Router(),
  isNonEmptyString,
  pingLang,
  getAsset,
});

exports.auth = require("./auth");
exports.compile = require("./compile");
exports.data = require("./data");
exports.root = require("./root");
exports.task = require("./task");

exports.langRouter = langRouter;
exports.configHandler = configHandler;
