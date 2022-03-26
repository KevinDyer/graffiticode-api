const { createHash } = require('crypto');
const admin = require('firebase-admin');
const { FieldValue } = require('@google-cloud/firestore');
const { encodeID, decodeID } = require('../id');
const { NotFoundError } = require('./errors');

const createCodeHash = code =>
  createHash('sha256')
    .update(JSON.stringify(code))
    .digest('hex');

const buildTaskCreate = ({ db }) => async (task) => {
  const db = admin.firestore();
  const { lang, code } = task;
  const codeHash = createCodeHash(task.code);

  const langId = Number.parseInt(task.lang);
  const { codeId } = await db.runTransaction(async (t) => {

    const taskIdRef = db.doc(`task-ids/${codeHash}`);
    const taskIdDoc = await t.get(taskIdRef);
    if (taskIdDoc.exists) {
      const codeId = taskIdDoc.get('codeId');
      return { codeId, exists: true };
    }

    const tasksCountersRef = db.doc('counters/tasks');
    const tasksCountersDoc = await t.get(tasksCountersRef);
    if (!tasksCountersDoc.exists) {
      throw new Error(`tasks counters do not exist, does the db need to be initialized?`);
    }
    const codeId = tasksCountersDoc.get('nextCodeId');

    t.update(tasksCountersRef, { nextCodeId: FieldValue.increment(1) });
    t.set(taskIdRef, { codeId, count: 0 });

    const taskRef = db.doc(`tasks/${codeId.toString()}`);
    t.set(taskRef, { lang, code, codeHash });

    return { codeId, exists: false }
  });

  const taskRef = db.doc(`tasks/${codeId.toString()}`);
  await taskRef.update({ count: FieldValue.increment(1) });

  return encodeID([langId, codeId, 0]);
};

const buildTaskFindById = ({ db }) => async (id) => {
  const [langId, codeId] = decodeID(id);
  const taskRef = db.doc(`tasks/${codeId.toString()}`);
  const taskDoc = await taskRef.get();
  if (!taskDoc.exists) {
    throw new NotFoundError();
  }
  const lang = taskDoc.get('lang');
  const code = taskDoc.get('code');
  return { lang, code };
};

const buildFirestoreTaskDao = ({ db }) => {
  const create = buildTaskCreate({ db });
  const findById = buildTaskFindById({ db });
  return { create, findById };
};
exports.buildFirestoreTaskDao = buildFirestoreTaskDao;
