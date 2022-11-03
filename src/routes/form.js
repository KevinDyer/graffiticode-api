import { Router } from "express";
import { isNonEmptyString } from "../util.js";
import { buildHttpHandler } from "./utils.js";

export const buildFormRouter = ({ pingLang, getBaseUrlForLanguage }) => {
  const router = new Router();
  router.get("/", buildHttpHandler(async (req, res) => {
    const { lang, data } = req.query;
    if (!await pingLang(lang)) {
      res.sendStatus(404);
    } else if (isNonEmptyString(data)) {
      const baseUrl = getBaseUrlForLanguage(lang);
      const path = `/form?data=${data}`;
      const url = baseUrl + path;
      res.redirect(url);
    } else {
      res.sendStatus(200);
    }
  }));
  return router;
};
