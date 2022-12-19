import { isNonEmptyString } from "../util.js";
import { HttpError } from "./../errors/http.js";

export const parseIdsFromRequest = req => {
  const id = req.query.id;
  if (isNonEmptyString(id)) {
    return id.split(",");
  }
  return [];
};

export const parseAuthFromRequest = req => {
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

export const parseAuthTokenFromRequest = req => {
  let headerAuthToken = req.get("Authorization");
  if (isNonEmptyString(headerAuthToken)) {
    if (headerAuthToken.startsWith("Bearer ")) {
      headerAuthToken = headerAuthToken.slice("Bearer ".length);
    }
    return headerAuthToken;
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

export const buildHttpHandler = handler => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (err) {
    handleError(err, res, next);
  }
};

export const createError = (code, message) => ({ code, message });

export const createErrorResponse = error => ({ status: "error", error, data: null });

export const createSuccessResponse = data => ({ status: "success", error: null, data });

export const getStorageTypeForRequest = req => {
  console.log("getStorageTypeForRequest() query=" + JSON.stringify(req.query, null, 2));
  return (
    req.get("x-graffiticode-storage-type")
    || req.query.store
  );
};

export const buildGetTaskDaoForRequest = taskDaoFactory => req =>
  console.log("buildGetTaskDaoForRequest() query=" + JSON.stringify(req.query, null, 2));  
  taskDaoFactory.create({ type: getStorageTypeForRequest(req) });

export const optionsHandler = buildHttpHandler(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Request-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type");
  res.set("Connection", "Keep-Alive");
  res.sendStatus(204);
});
