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

  const callCreate = async task =>
    testEnv.withSecurityRulesDisabled(context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      return taskDao.create(task);
    });

  const callFindById = async id =>
    testEnv.withSecurityRulesDisabled(context => {
      const db = context.firestore();
      const taskDao = buildFirestoreTaskDao({ db });
      return taskDao.findById(id);
    });

  it('should throw NotFoundError if task is not created', async () => {
    await expect(callFindById(TASK_ID1)).rejects.toThrow();
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