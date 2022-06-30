const { buildFirestoreTaskDao, encodeId, createFirestoreDb } = require('./firestore');
const { TASK1, TASK2 } = require('../testing/fixture');

describe('storage/firestore', () => {
  const db = createFirestoreDb({});
  const taskDao = buildFirestoreTaskDao({ db });

  it('should throw NotFoundError if task is not created', async () => {
    const id = encodeId({ taskIds: ['foo'] });

    await expect(taskDao.get({ id })).rejects.toThrow();
  });

  it('should create task', async () => {
    const id = await taskDao.create({ task: TASK1 });

    await expect(taskDao.get({ id })).resolves.toStrictEqual([TASK1]);
  });

  it('should create tasks', async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });

    await expect(taskDao.get({ id: id1 })).resolves.toStrictEqual([TASK1]);
    await expect(taskDao.get({ id: id2 })).resolves.toStrictEqual([TASK2]);
  });

  it('should get multi task id', async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });
    const multiId = await taskDao.appendIds(id1, id2);

    await expect(taskDao.get({ id: multiId })).resolves.toStrictEqual([TASK1, TASK2]);
  });

  it('should get appended task ids', async () => {
    const id1 = await taskDao.create({ task: TASK1 });
    const id2 = await taskDao.create({ task: TASK2 });
    const id = `${id1}+${id2}`;

    await expect(taskDao.get({ id })).resolves.toStrictEqual([TASK1, TASK2]);
  });
});