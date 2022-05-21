const { createHash } = require('crypto');
const admin = require('firebase-admin');
const { encodeID, decodeID } = require('../id');
const { NotFoundError } = require('./errors');
const {
  doc,
  getDoc,
  increment,
  setDoc,
  updateDoc,
} = require('@firebase/firestore');

const createCodeHash = code =>
  createHash('sha256')
    .update(JSON.stringify(code))
    .digest('hex');

const buildTaskCreate = ({ db }) => async (task) => {
  const { lang, code } = task;
  const codeHash = createCodeHash(code);
  const langId = Number.parseInt(lang);

  const taskRef = doc(db, `tasks/${codeHash}`);
  const taskDoc = await getDoc(taskRef);

  if (taskDoc.exists()) {
    await updateDoc(taskRef, { count: increment(1) })
  } else {
    await setDoc(taskRef, { lang, code, codeHash, count: 1 });
  }

  return encodeID([langId, codeHash, 0]);
};

const buildTaskFindById = ({ db }) => async (id) => {
  const [langId, codeId] = decodeID(id);
  const taskRef = doc(db, `tasks/${codeId.toString()}`);
  const taskDoc = await getDoc(taskRef);
  if (!taskDoc.exists()) {
    console.log(`missing tasks/${codeId.toString()}`);
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

const createFirestoreDb = ({ }) => {
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
  return db;
};
exports.createFirestoreDb = createFirestoreDb;
