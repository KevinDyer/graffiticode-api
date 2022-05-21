const { Router } = require('express');
const {
  buildHttpHandler,
  createErrorResponse,
  createSuccessResponse,
  parseIdsFromRequest,
  parseAuthFromRequest,
  optionsHandler,
} = require('./utils');

const getTasksFromTask = (task) => {
  return !task && []
    || !(task instanceof Array) && [task]
    || task;
};

const getIdFromIds = (ids) => {
  return ids.length === 1 && ids[0] || ids;
}

const buildGetTaskHandler = ({ taskDaoFactory }) => buildHttpHandler(async (req, res) => {
  const auth = parseAuthFromRequest(req);
  const ids = parseIdsFromRequest(req);
  if (ids.length < 1) {
    res.status(400).json(createErrorResponse('must provide at least one id'));
    return;
  }
  const taskDao = taskDaoFactory.create({});
  const tasks = await Promise.all(ids.map((id) => taskDao.findById(id)));
  res.set("Access-Control-Allow-Origin", "*");
  res.status(200).json(createSuccessResponse(tasks));
});

const buildPostTaskHandler = ({ taskDaoFactory }) => buildHttpHandler(async (req, res) => {
  const type = req.get('x-graffiticode-storage-type');
  const taskDao = taskDaoFactory.create({ type });
  const tasks = getTasksFromTask(req.body.task);
  if (tasks.length < 1) {
    res.status(400).json(createErrorResponse('must provide at least one task'));
    return;
  }
  const ids = await Promise.all(tasks.map((task) => taskDao.create(task)));
  const id = getIdFromIds(ids);
  res.set("Access-Control-Allow-Origin", "*");
  res.status(200).json(createSuccessResponse({ id }));
});

module.exports = ({ taskDaoFactory }) => {
  const router = new Router();
  router.get('/', buildGetTaskHandler({ taskDaoFactory }));
  router.post('/', buildPostTaskHandler({ taskDaoFactory }));
  router.options('/', optionsHandler);
  return router;
};
