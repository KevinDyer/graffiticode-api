import { Router } from "express";
import { InvalidArgumentError } from "../errors/http.js";

import {
  buildGetTaskDaoForId,
  buildHttpHandler,
  createSuccessResponse,
  parseIdsFromRequest,
  parseAuthFromRequest,
  optionsHandler
} from "./utils.js";

const buildGetDataHandler = ({ taskDaoFactory, dataApi }) => {
  const getTaskDaoForId = buildGetTaskDaoForId(taskDaoFactory);
  return buildHttpHandler(async (req, res) => {
    const auth = req.auth.context;
    const authToken = parseAuthFromRequest(req);
    const ids = parseIdsFromRequest(req);
    if (ids.length < 1) {
      throw new InvalidArgumentError("must provide at least one id");
    }
    const taskDao = getTaskDaoForId(ids[0]);
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

export default ({ taskDaoFactory, dataApi }) => {
  const router = new Router();
  router.get("/", buildGetDataHandler({ taskDaoFactory, dataApi }));
  router.options("/", optionsHandler);
  return router;
};
