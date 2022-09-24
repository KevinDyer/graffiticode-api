const { buildHttpHandler, parseAuthTokenFromRequest } = require("./utils");

module.exports = ({ validateToken }) => buildHttpHandler(async (req, res, next) => {
  req.auth = {};

  const token = parseAuthTokenFromRequest(req);
  req.auth.token = token;

  let authContext = null;
  if (token) {
    authContext = await validateToken(token);
  }
  req.auth.context = authContext;

  next();
});
