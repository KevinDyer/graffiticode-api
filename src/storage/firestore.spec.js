const fs = require('fs');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { buildFirestoreTaskDao, encodeId } = require('./firestore');
const { TASK1, TASK2 } = require('../testing/fixture');

describe('storage/firestore', () => {
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
      await testEnv.clearFirestore();
      await testEnv.cleanup();
      testEnv = null;
    }
  });

  const callCreate = async task => {
    let id;
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      id = await taskDao.create(task);
    });
    return id
  };

  const callGet = async id => {
    let task;
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      task = await taskDao.get(id);
    });
    return task;
  };

  const callAppendIds = async (id, ...otherIds) => {
    let newId;
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      newId = await taskDao.appendIds(id, ...otherIds);
    });
    return newId;
  };

  it('should throw NotFoundError if task is not created', async () => {
    const id = encodeId({ taskIds: ['foo'] });

    await expect(callGet(id)).rejects.toThrow();
  });

  it('should create task', async () => {
    const id = await callCreate(TASK1);

    await expect(callGet(id)).resolves.toStrictEqual([TASK1]);
  });

  it('should create tasks', async () => {
    const id1 = await callCreate(TASK1);
    const id2 = await callCreate(TASK2);

    await expect(callGet(id1)).resolves.toStrictEqual([TASK1]);
    await expect(callGet(id2)).resolves.toStrictEqual([TASK2]);
  });

  it('should get multi task id', async () => {
    const id1 = await callCreate(TASK1);
    const id2 = await callCreate(TASK2);
    const multiId = await callAppendIds(id1, id2);

    await expect(callGet(multiId)).resolves.toStrictEqual([TASK1, TASK2]);
  });
});