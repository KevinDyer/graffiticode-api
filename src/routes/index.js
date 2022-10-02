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

export { auth } from "./auth.js";
export { compile } from "./compile.js";
export { data } from "./data.js";
export { root } from "./root.js";
export { task } from "./task.js";
