import { Router } from "express";
import { isNonEmptyString } from "../util.js";
import { buildHttpHandler, optionsHandler } from "./utils.js";
import { buildGetTasks } from "./task.js";

const buildGetFormHandler = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  const router = new Router();
  return buildHttpHandler(async (req, res) => {
    const { id, lang, data } = req.query;
    if (isNonEmptyString(id)) {
      const getTasks = buildGetTasks({ taskDaoFactory, req });
      const tasks = await getTasks({ ids: [id] });
      const lang = tasks[0].lang;
      if (!await pingLang(lang)) {
        res.sendStatus(404);
      }
      const baseUrl = getBaseUrlForLanguage(lang);
      const data = {
        id: id,
        url: `http://${req.headers.host}/data?id=${id}`,
      };
      const path = `/form?data=${JSON.stringify(data)}`;
      const url = baseUrl + path;
      console.log("GET /form url=" + url);
      res.redirect(url);
    } else if (isNonEmptyString(data)) {
      if (!await pingLang(lang)) {
        res.sendStatus(404);
      }
      const baseUrl = getBaseUrlForLanguage(lang);
      const path = `/form?data=${data}`;
      const url = baseUrl + path;
      res.redirect(url);
    } else {
      res.sendStatus(200);
    }
  });
  return router;
};

export const buildFormRouter = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetFormHandler({ pingLang, getBaseUrlForLanguage })({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
