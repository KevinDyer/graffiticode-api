const { Router } = require("express");
const { InvalidArgumentError } = require("../errors/http");
const {
  buildGetTaskDaoForRequest,
  buildHttpHandler,
  createSuccessResponse,
  parseIdsFromRequest,
  optionsHandler
} = require("./utils");

const normalizeTasksParameter = tasks => {
  if (!Array.isArray(tasks)) {
    return [tasks];
  }
  return tasks;
};

const getIdFromIds = ids => {
  if (ids.length === 1) {
    return ids[0];
  } else {
    return ids;
  }
};

const buildGetTaskHandler = ({ taskDaoFactory }) => {
  const getTaskDaoForRequest = buildGetTaskDaoForRequest(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const auth = req.auth.context;
    const ids = parseIdsFromRequest(req);
    if (ids.length < 1) {
      throw new InvalidArgumentError("must provide at least one id");
    }

    const taskDao = getTaskDaoForRequest(req);
    const tasksForIds = await Promise.all(ids.map(async id => taskDao.get({ id, auth })));
    const tasks = tasksForIds.reduce((tasks, tasksForId) => {
      tasks.push(...tasksForId);
      return tasks;
    }, []);

    res.set("Access-Control-Allow-Origin", "*");
    res.status(200).json(createSuccessResponse(tasks));
  });
};

const buildPostTaskHandler = ({ taskDaoFactory }) => {
  const getTaskDaoForRequest = buildGetTaskDaoForRequest(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const auth = req.auth.context;
    const tasks = normalizeTasksParameter(req.body.task);
    if (tasks.length < 1) {
      throw new InvalidArgumentError("must provide at least one task");
    }

    const taskDao = getTaskDaoForRequest(req);
    const ids = await Promise.all(tasks.map(task => taskDao.create({ task, auth })));
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
