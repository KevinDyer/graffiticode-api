const { Router } = require("express");
const {
  buildGetTaskDaoForRequest,
  buildHttpHandler,
  createSuccessResponse,
  parseIdsFromRequest,
  parseAuthFromRequest,
  optionsHandler
} = require("./utils");

const buildGetDataHandler = ({ taskDaoFactory, dataApi }) => {
  const getTaskDaoForRequest = buildGetTaskDaoForRequest(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const auth = req.auth.context;
    const authToken = parseAuthFromRequest(req);
    const ids = parseIdsFromRequest(req);
    if (ids.length < 1) {
      throw new InvalidArgumentError("must provide at least one id");
    }

    const taskDao = getTaskDaoForRequest(req);
    const objs = await Promise.all(ids.map(id => dataApi.get({ taskDao, id, auth, authToken })));

    let data;
    if (objs.length > 1) {
      data = objs;
    } else {
      data = objs[0];
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json(createSuccessResponse(data));
  });
};

module.exports = ({ taskDaoFactory, dataApi }) => {
  const router = new Router();
  router.get("/", buildGetDataHandler({ taskDaoFactory, dataApi }));
  router.options("/", optionsHandler);
  return router;
};
