const buildGetAsset = ({ getBaseUrlForLanguage, bent }) => {
  return async (lang, path) => {
    const key = `${lang}.${path}`;
    try {
      const baseUrl = getBaseUrlForLanguage(lang);
      const getLanguageAsset = bent(baseUrl, "string");
      const asset = await getLanguageAsset(path);
      return asset;
    } catch (err) {
      throw err;
    }
  };
};
exports.buildGetAsset = buildGetAsset;
