const { buildMemoryTaskDao } = require('./memory');
const { TASK1, TASK_ID1, TASK2 } = require('../testing/fixture');

describe('storage/memory', () => {
  let taskDao = null;
  beforeAll(() => {
    taskDao = buildMemoryTaskDao();
  });

  it('should throw NotFoundError if task is not created', async () => {
    await expect(taskDao.get(TASK_ID1)).rejects.toThrow();
  });

  it('should return created task', async () => {
    const id = await taskDao.create(TASK1);

    await expect(taskDao.get(id)).resolves.toStrictEqual([TASK1]);
  });

  it('should return multi task id', async () => {
    const id1 = await taskDao.create(TASK1);
    const id2 = await taskDao.create(TASK2);
    const id = taskDao.appendIds(id1, id2);

    await expect(taskDao.get(id)).resolves.toStrictEqual([TASK1, TASK2]);
  });
});