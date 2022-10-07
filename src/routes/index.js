import { Router } from "express";
import { getConfig } from "./../config/index.js";
import { pingLang, getAsset } from "./../lang/index.js";
import { isNonEmptyString } from "./../util.js";
import { buildConfigHandler } from "./config.js";
import { buildLangRouter } from "./lang.js";

export const configHandler = buildConfigHandler({ getConfig });
export const langRouter = buildLangRouter({
  newRouter: () => new Router(),
  isNonEmptyString,
  pingLang,
  getAsset
});

export { default as auth } from "./auth.js";
export { default as compile } from "./compile.js";
export { default as data } from "./data.js";
export { default as root } from "./root.js";
export { default as task } from "./task.js";
