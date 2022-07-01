const buildGetData = ({ compile }) =>
  async ({ taskDao, id, auth, options }) => {
    const tasks = await taskDao.get({ id });
    const obj = await tasks.reduceRight(
      async (dataPromise, task) => {
        const data = await dataPromise;
        const { lang, code } = task;
        const obj = await compile({ lang, code, data, auth, options });
        return obj;
      },
      Promise.resolve({}),
    );
    return obj;
  };


exports.buildDataApi = ({ compile }) => {
  return { get: buildGetData({ compile }) };
};
