import { Router } from "express";
import { InvalidArgumentError, NotFoundError } from "../errors/http.js";
import { isNonEmptyString } from "../util.js";
import { buildHttpHandler, optionsHandler } from "./utils.js";
import { buildGetTasks } from "./task.js";

const checkLangParam = async ({ lang, pingLang }) => {
  if (/^\d+$/.test(lang)) {
    lang = `L${lang}`;
  }
  if (!/^[Ll]\d+$/.test(lang)) {
    throw new InvalidArgumentError(`Invalid lang ${lang}`);
  }
  if (!await pingLang(lang)) {
    throw new NotFoundError(`Language not found ${lang}`);
  }
  return lang;
};

const buildGetFormHandler = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  return buildHttpHandler(async (req, res) => {
    let { id, lang, data } = req.query;
    if (isNonEmptyString(id)) {
      const getTasks = buildGetTasks({ taskDaoFactory, req });
      const auth = req.auth.context;
      const tasks = await getTasks({ auth, ids: [id] });
      lang = await checkLangParam({ lang: tasks[0].lang, pingLang });
      const baseUrl = getBaseUrlForLanguage(lang);
      const protocol = baseUrl.indexOf("localhost") !== -1 && "http" || "https";
      const formUrl = `${baseUrl}/form?url=${protocol}://${req.headers.host}/data?id=${id}`;
      res.redirect(formUrl);
    } else if (isNonEmptyString(data)) {
      lang = await checkLangParam({ lang, pingLang });
      const baseUrl = getBaseUrlForLanguage(lang);
      const formUrl = `${baseUrl}/form?data=${data}`;
      res.redirect(formUrl);
    } else {
      throw new InvalidArgumentError("Missing or invalid parameters");
    }
  });
};

export const buildFormRouter = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetFormHandler({ pingLang, getBaseUrlForLanguage })({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
