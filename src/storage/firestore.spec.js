const fs = require('fs');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { buildFirestoreTaskDao, encodeId, createFirestoreDb } = require('./firestore');
const { TASK1, TASK2 } = require('../testing/fixture');

describe('storage/firestore', () => {
  const db = createFirestoreDb({});
  const taskDao = buildFirestoreTaskDao({ db });

  let testEnv = null;
  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'graffiticode',
      firestore: {
        host: 'localhost',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    if (testEnv) {
      // await testEnv.clearFirestore();
      await testEnv.cleanup();
      testEnv = null;
    }
  });

  it('should throw NotFoundError if task is not created', async () => {
    const id = encodeId({ taskIds: ['foo'] });

    await expect(taskDao.get(id)).rejects.toThrow();
  });

  it('should create task', async () => {
    const id = await taskDao.create(TASK1);

    await expect(taskDao.get(id)).resolves.toStrictEqual([TASK1]);
  });

  it('should create tasks', async () => {
    const id1 = await taskDao.create(TASK1);
    const id2 = await taskDao.create(TASK2);

    await expect(taskDao.get(id1)).resolves.toStrictEqual([TASK1]);
    await expect(taskDao.get(id2)).resolves.toStrictEqual([TASK2]);
  });

  it('should get multi task id', async () => {
    const id1 = await taskDao.create(TASK1);
    const id2 = await taskDao.create(TASK2);
    const multiId = await taskDao.appendIds(id1, id2);

    await expect(taskDao.get(multiId)).resolves.toStrictEqual([TASK1, TASK2]);
  });

  it('should get appended task ids', async () => {
    const id1 = await taskDao.create(TASK1);
    const id2 = await taskDao.create(TASK2);
    const id = `${id1}+${id2}`;

    await expect(taskDao.get(id)).resolves.toStrictEqual([TASK1, TASK2]);
  });
});