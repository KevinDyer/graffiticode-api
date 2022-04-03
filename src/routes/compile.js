const { Router } = require('express');

const { } = require('../comp');
const { error, messageFromErrors, setMetadataBuilds } = require('../util');
const build = require('../../build.json');
const {
  buildHttpHandler,
  createSuccessResponse,
  parseAuthFromRequest,
  optionsHandler,
} = require('./utils');
const { decodeID, encodeID } = require('../id');

const getObjFromData = (data) => {
  return data.length === 1 && data[0] || data;
}


const buildPostCompileHandler = ({ taskDaoFactory, dataApi }) => buildHttpHandler(async (req, res) => {
  const auth = parseAuthFromRequest(req);
  const item = req.body.item || {};
  const { lang, code, data, options } = item instanceof Array && item[0] || item;
  const taskDao = taskDaoFactory.create();
  let taskId = await taskDao.create({ lang, code });
  let dataTaskId;
  if (data) {
    dataTaskId = await taskDao.create({ lang: '113', code: data });
    const [langId, codeId] = decodeID(taskId);
    const dataIds = decodeID(dataTaskId);
    taskId = encodeID([langId, codeId, ...dataIds]);
  }
  let [obj] = await dataApi.get(auth, [taskId]);
  obj = getObjFromData(obj);
  res.set("Access-Control-Allow-Origin", "*");
  res.status(200).json(createSuccessResponse(obj));
});

module.exports = ({ taskDaoFactory, dataApi }) => {
  const router = new Router();
  router.post('/', buildPostCompileHandler({ taskDaoFactory, dataApi }));
  router.options('/', optionsHandler);
  return router;
};
