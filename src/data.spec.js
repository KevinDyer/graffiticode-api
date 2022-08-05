const { buildDataApi } = require('./data');
const { buildTaskDaoFactory } = require('./storage');
const { createFirestoreDb } = require('./storage/firestore');
const { DATA1, DATA2, TASK1, TASK2 } = require('./testing/fixture');

describe('data', () => {
  let db;
  beforeAll(() => {
    db = createFirestoreDb({});
  });

  let taskDao;
  let compile;
  let dataApi;
  beforeEach(() => {
    taskDao = buildTaskDaoFactory({}).create({ type: 'memory' });
    compile = jest.fn();
    dataApi = buildDataApi({ compile });
  });

  afterEach(async () => {
    const cols = await db.listCollections();
    await Promise.all(cols.map(c => db.recursiveDelete(c)));
  });

  const mockCompileData = data =>
    compile.mockResolvedValueOnce(data);

  it('should compile a created task', async () => {
    const id = await taskDao.create({ task: TASK1 });
    mockCompileData(DATA1);

    await expect(dataApi.get({ taskDao, id })).resolves.toStrictEqual(DATA1);

    expect(compile).toHaveBeenCalledTimes(1);
    expect(compile).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        lang: TASK1.lang,
        code: TASK1.code,
      }),
    );
  });

  it('should compile created tasks', async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });
    const id = taskDao.appendIds(id1, id2);
    mockCompileData(DATA1);
    mockCompileData(DATA2);

    await expect(dataApi.get({ taskDao, id })).resolves.toStrictEqual(DATA2);

    expect(compile).toHaveBeenCalledTimes(2);
    expect(compile).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        lang: TASK2.lang,
        code: TASK2.code,
      }),
    );
    expect(compile).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        lang: TASK1.lang,
        code: TASK1.code,
      }),
    );
  });
});
