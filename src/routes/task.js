const { Router } = require("express");
const { InvalidArgumentError } = require("../errors/http");
const {
  buildHttpHandler,
  createSuccessResponse,
  parseIdsFromRequest,
  parseAuthFromRequest,
  optionsHandler,
} = require("./utils");

const getTasksFromTask = (task) => {
  return !task && []
    || !(task instanceof Array) && [task]
    || task;
};

const getIdFromIds = (ids) => {
  return ids.length === 1 && ids[0] || ids;
}

const buildGetTaskDaoForRequest = taskDaoFactory => req =>
  taskDaoFactory.create({ type: req.get("x-graffiticode-storage-type") });

const buildGetTaskHandler = ({ taskDaoFactory }) => {
  const getTaskDaoForRequest = buildGetTaskDaoForRequest(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const auth = parseAuthFromRequest(req);
    const ids = parseIdsFromRequest(req);
    if (ids.length < 1) {
      throw new InvalidArgumentError("must provide at least one id");
    }
    const taskDao = getTaskDaoForRequest(req);
    const tasks = await Promise.all(ids.map((id) => taskDao.findById(id)));
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json(createSuccessResponse(tasks));
  });
};

const buildPostTaskHandler = ({ taskDaoFactory }) => {
  const getTaskDaoForRequest = buildGetTaskDaoForRequest(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const tasks = getTasksFromTask(req.body.task);
    if (tasks.length < 1) {
      throw new InvalidArgumentError("must provide at least one task");
    }
    const taskDao = getTaskDaoForRequest(req);
    const ids = await Promise.all(tasks.map((task) => taskDao.create(task)));
    const id = getIdFromIds(ids);
    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json(createSuccessResponse({ id }));
  });
};

module.exports = ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetTaskHandler({ taskDaoFactory }));
  router.post("/", buildPostTaskHandler({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
