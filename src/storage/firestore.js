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
  // const db = admin.firestore(app);
  const { lang, code } = task;
  const codeHash = createCodeHash(code);
  const langId = Number.parseInt(lang);

  const taskRef = db.doc(`tasks/${codeHash}`);
  const taskDoc = await taskRef.get();

  if (taskDoc.exists) {
    await taskRef.update({ count: FieldValue.increment(1) })
  } else {
    await taskRef.create({ lang, code, codeHash, count: 1 });
  }

  return encodeID([langId, codeHash, 0]);
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

const buildFirestoreTaskDao = () => {
  const firebaseConfig = {
    apiKey: 'AIzaSyAoVuUNi8ElnS7cn6wc3D8XExML-URLw0I',
    authDomain: 'graffiticode.firebaseapp.com',
    databaseURL: 'https://graffiticode.firebaseio.com',
    projectId: 'graffiticode',
    storageBucket: 'graffiticode.appspot.com',
    messagingSenderId: '656973052505',
    appId: '1:656973052505:web:f3f3cc6397a844599c8f48',
    measurementId: 'G-KRPK1CDB19',
  };
  const app = admin.initializeApp(firebaseConfig);
  const db = admin.firestore(app);
  const create = buildTaskCreate({ db });
  const findById = buildTaskFindById({ db });
  return { create, findById };
};
exports.buildFirestoreTaskDao = buildFirestoreTaskDao;
