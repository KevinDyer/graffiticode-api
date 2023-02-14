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

    const params = new URLSearchParams();
    if (isNonEmptyString(id)) {
      const dataParams = new URLSearchParams();
      dataParams.set("id", id);
      if (req.auth.token) {
        dataParams.set("access_token", req.auth.token);
      }
      const protocol = baseUrl.indexOf("localhost") !== -1 && "http" || "https";
      params.set("url", `${protocol}://${req.headers.host}/data?${dataParams.toString()}`);
    } else if (isNonEmptyString(data)) {
      params.set("data", data);
    } else {
      return res.sendStatus(200);
    }

    const formUrl = `${baseUrl}/form?${params.toString()}`;
    res.redirect(formUrl);
  });
};

export const buildFormRouter = ({ pingLang, getBaseUrlForLanguage }) => ({ taskDaoFactory }) => {
  const router = new Router();
  router.get("/", buildGetFormHandler({ pingLang, getBaseUrlForLanguage })({ taskDaoFactory }));
  router.options("/", optionsHandler);
  return router;
};
