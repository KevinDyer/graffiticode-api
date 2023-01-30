export const buildCompile = ({ getBaseUrlForLanguage, bent }) => async (lang, req) => {
  const baseUrl = getBaseUrlForLanguage(lang);
  const compilePost = bent(baseUrl, "POST", "json");
  console.log("buildCompile() baseUrl=" + baseUrl);
  return await compilePost("/compile", req);
};
