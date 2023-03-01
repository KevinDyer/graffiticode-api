import { isNonEmptyString } from "../util.js";
import { HttpError } from "./../errors/http.js";
import { decodeID } from "./../id.js";

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
  const { access_token: queryAccessToken } = req.query;
  if (isNonEmptyString(queryAccessToken)) {
    return queryAccessToken;
  }
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
  return (
    req.get("x-graffiticode-storage-type")
  );
};

export const buildGetTaskDaoForRequest = taskDaoFactory => req =>
  taskDaoFactory.create({ type: getStorageTypeForRequest(req) });

export const getStorageTypeForId = id => {
  try {
    const ids = decodeID(id);
    if (ids[1] === 0) {
      // [_, 0, _] means invalid id.
      return "persistent";
    }
    return "ephemeral";
  } catch (x) {
    // Just in case.
    return "persistent";
  }
};

export const buildGetTaskDaoForId = taskDaoFactory => id =>
  taskDaoFactory.create({ type: getStorageTypeForId(id) });

export const optionsHandler = buildHttpHandler(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Request-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type");
  res.set("Connection", "Keep-Alive");
  res.sendStatus(204);
});
