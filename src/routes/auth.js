const { buildHttpHandler, parseAuthTokenFromRequest } = require("./utils");

module.exports = ({ }) => buildHttpHandler(async (req, res, next) => {
  const authToken = parseAuthTokenFromRequest(req);
  req.authToken = authToken;
  next();
});
