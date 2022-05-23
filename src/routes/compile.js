const { Router } = require("express");
const {
  buildHttpHandler,
  createSuccessResponse,
  parseAuthFromRequest,
  optionsHandler,
} = require("./utils");
const { isNonNullObject } = require("../util");
const { InvalidArgumentError } = require("../errors/http");

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

module.exports = ({ compile }) => {
  const router = new Router();
  router.post("/", buildPostCompileHandler({ compile }));
  router.options("/", optionsHandler);
  return router;
};
