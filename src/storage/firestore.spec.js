const fs = require('fs');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { buildFirestoreTaskDao, encodeFirestoreId } = require('./firestore');
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

  const callFindById = async id => {
    let task;
    await testEnv.withSecurityRulesDisabled(async context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      task = await taskDao.findById(id);
    });
    return task;
  };

  it('should throw NotFoundError if task is not created', async () => {
    const id = encodeFirestoreId({ langId: 0, taskId: 'foo' });

    await expect(callFindById(id)).rejects.toThrow();
  });

  it('should create task', async () => {
    const id = await callCreate(TASK1);

    await expect(callFindById(id)).resolves.toStrictEqual(TASK1);
  });

  it('should create tasks', async () => {
    const id1 = await callCreate(TASK1);
    const id2 = await callCreate(TASK2);

    await expect(callFindById(id1)).resolves.toStrictEqual(TASK1);
    await expect(callFindById(id2)).resolves.toStrictEqual(TASK2);
  });
});