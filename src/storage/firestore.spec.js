const fs = require('fs');
const {
  doc,
  setDoc,
} = require('@firebase/firestore');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const admin = require('firebase-admin');
const { buildFirestoreTaskDao } = require('./firestore');
const { TASK1, TASK_ID1, TASK2 } = require('../testing/fixture');

admin.initializeApp({ projectId: 'graffiticode' });

describe('storage/firestore', () => {
  let testEnv = null;
  let taskDao = null;
  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'graffiticode',
      firestore: {
        host: 'localhost',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'counters', 'tasks'), { nextCodeId: 0 });
    });
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.cleanup();
      testEnv = null;
    }
  });

  beforeEach(() => {
    const db = admin.firestore();
    taskDao = buildFirestoreTaskDao({ db });
  });

  it('should throw NotFoundError if task is not created', async () => {
    await expect(taskDao.findById(TASK_ID1)).rejects.toThrow();
  });

  it('should create task', async () => {
    const id = await taskDao.create(TASK1);

    await expect(taskDao.findById(id)).resolves.toStrictEqual(TASK1);
  });

  it('should create tasks', async () => {
    const id1 = await taskDao.create(TASK1);
    const id2 = await taskDao.create(TASK2);

    await expect(taskDao.findById(id1)).resolves.toStrictEqual(TASK1);
    await expect(taskDao.findById(id2)).resolves.toStrictEqual(TASK2);
  });
});