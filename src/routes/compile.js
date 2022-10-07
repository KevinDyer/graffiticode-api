import { Router } from "express";

import {
  buildHttpHandler,
  createSuccessResponse,
  parseAuthFromRequest,
  optionsHandler
} from "./utils.js";

import { isNonNullObject } from "../util.js";
import { InvalidArgumentError } from "../errors/http.js";

const buildPostCompileHandler = ({ compile }) => buildHttpHandler(async (req, res) => {
  const auth = parseAuthFromRequest(req);

  const item = req.body.item;
  if (!isNonNullObject(item)) {
    throw new InvalidArgumentError("item must be a non-null object");
  }

  const { lang, code, data, options } = item;
  const obj = await compile({ lang, code, data, auth, options });

  res.set("Access-Control-Allow-Origin", "*");
  res.status(200).json(createSuccessResponse(obj));
});

export default ({ compile }) => {
  const router = new Router();
  router.post("/", buildPostCompileHandler({ compile }));
  router.options("/", optionsHandler);
  return router;
};
