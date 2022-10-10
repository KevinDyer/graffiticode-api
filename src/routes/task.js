import { Router } from "express";
import { InvalidArgumentError } from "../errors/http.js";
import { parse } from "../lang/parse.js";
import {
  buildGetTaskDaoForRequest,
  buildHttpHandler,
  createSuccessResponse,
  parseIdsFromRequest,
  optionsHandler
} from "./utils.js";

const normalizeTasksParameter = async tasks => {
  tasks = !Array.isArray(tasks) && [tasks] || tasks;
  tasks.forEach(async (task) => {
    if (typeof task.code === 'string') {
      const lang = task.lang;
      const code = task.code;
      // WARNING mutation alert!
      task.code = await parse(lang, code);
    }
  });
  tasks = await Promise.all(tasks);
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
    const tasks = await normalizeTasksParameter(req.body.task);
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

export default ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetTaskHandler({ taskDaoFactory }));
  router.post("/", buildPostTaskHandler({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
