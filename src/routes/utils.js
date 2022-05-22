const { isNonEmptyString } = require("../util");
const { HttpError } = require("./../errors/http");

exports.parseIdsFromRequest = req => {
  const id = req.query.id;
  if (isNonEmptyString(id)) {
    return id.split(",");
  }
  return [];
};

exports.parseAuthFromRequest = req => {
  const { auth: queryAuth } = req.query;
  if (isNonEmptyString(queryAuth)) {
    return queryAuth;
  }
  const { auth: bodyAuth } = req.body;
  if (isNonEmptyString(bodyAuth)) {
    return bodyAuth;
  }
  return null;
};

const handleError = (err, res, next) => {
  if (err instanceof HttpError) {
    res
      .status(err.statusCode)
      .json(createErrorResponse(createError(err.code, err.message)));
  } else {
    next(err);
  }
};

const buildHttpHandler = handler => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    handleError(err, res, next);
  }
};
exports.buildHttpHandler = buildHttpHandler;

const createError = (code, message) => ({ code, message });
exports.createError = createError;

const createErrorResponse = error => ({ status: "error", error, data: null });
exports.createErrorResponse = createErrorResponse;

const createSuccessResponse = data => ({ status: "success", error: null, data });
exports.createSuccessResponse = createSuccessResponse;

exports.optionsHandler = buildHttpHandler(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Request-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type");
  res.set("Connection", "Keep-Alive");
  res.sendStatus(204);
});
