const buildGetData = ({ compile }) =>
  async ({ taskDao, id, auth, authToken, options }) => {
    const tasks = await taskDao.get({ id, auth });
    const obj = await tasks.reduceRight(
      async (dataPromise, task) => {
        const data = await dataPromise;
        const { lang, code } = task;
        const obj = await compile({
          lang,
          code,
          data,
          auth: authToken,
          options
        });
        return obj;
      },
      Promise.resolve({})
    );
    return obj;
  };

exports.buildDataApi = ({ compile }) => {
  return { get: buildGetData({ compile }) };
};
