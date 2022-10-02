const express = require("express");
const morgan = require("morgan");
const { UnauthenticatedError, InvalidArgumentError } = require("../errors/http");
const { buildHttpHandler } = require("../routes/utils");
const { isNonNullObject, isNonEmptyString } = require("../util");

const buildFakeAuthProvider = () => {
  const contextsByToken = new Map();
  return {
    addContextForToken: (token, context) => contextsByToken.set(token, context),
    validate: async token => {
      if (!contextsByToken.has(token)) {
        throw new UnauthenticatedError(`no context for ${token}`);
      }
      const context = contextsByToken.get(token);
      if (context instanceof Error) {
        throw context;
      }
      return context;
    }
  };
};
exports.buildFakeAuthProvider = buildFakeAuthProvider;

const buildArtCompilerAuthApplication = () => {
  const idsByToken = new Map();

  const app = express();
  app.use(morgan("dev"));
  app.use(express.json({}));
  app.use(express.urlencoded({ extended: true }));
  app.post("/validateSignIn", buildHttpHandler(async (req, res) => {
    if (!isNonNullObject(req.body) || !isNonEmptyString(req.body.jwt)) {
      throw new InvalidArgumentError("must provide a token");
    }
    const token = req.body.jwt;
    if (!idsByToken.has(token)) {
      throw new UnauthenticatedError();
    }
    const id = idsByToken.get(token);
    if (id instanceof Error) {
      throw id;
    }
    res.status(200).json({ id });
  }));
  app.use((err, req, res, next) => res.sendStatus(500));

  return {
    app,
    addIdForToken: (token, id) => idsByToken.set(token, id),
    listen: (...params) => app.listen(...params)
  };
};
exports.buildArtCompilerAuthApplication = buildArtCompilerAuthApplication;
