import { Router } from "express";
import { InvalidArgumentError } from "../errors/http.js";
import { isNonEmptyString } from "../util.js";
import { buildHttpHandler, optionsHandler } from "./utils.js";

const buildGetFormHandler = ({ pingLang, getBaseUrlForLanguage }) => () => {
  return buildHttpHandler(async (req, res) => {
    let { id, lang, data } = req.query;
    if (/^\d+$/.test(lang)) {
      lang = `L${lang}`;
    }
    if (!/^[Ll]\d+$/.test(lang)) {
      throw new InvalidArgumentError(`invalid lang ${lang}`);
    }
    if (!await pingLang(lang)) {
      res.sendStatus(404);
      return;
    }
    const baseUrl = getBaseUrlForLanguage(lang);

    if (isNonEmptyString(id)) {
      const protocol = baseUrl.indexOf("localhost") !== -1 && "http" || "https";
      const formUrl = `${baseUrl}/form?url=${protocol}://${req.headers.host}/data?id=${id}`;
      res.redirect(formUrl);
    } else if (isNonEmptyString(data)) {
      const formUrl = `${baseUrl}/form?data=${data}`;
      res.redirect(formUrl);
    } else {
      res.sendStatus(200);
    }
  });
};

export const buildFormRouter = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetFormHandler({ pingLang, getBaseUrlForLanguage })({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
