const { createHash } = require('crypto');
const admin = require('firebase-admin');
const { NotFoundError } = require('./errors');
const {
  addDoc,
  collection,
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

const encodeFirestoreId = ({ langId, taskId }) =>
  Buffer.from(JSON.stringify({ typ: 'firestore', lid: langId, cid: taskId }), 'utf8').toString('base64url');
exports.encodeFirestoreId = encodeFirestoreId;

const decodeFirestoreId = id => {
  try {
    const { lid: langId, cid: taskId } = JSON.parse(Buffer.from(id, 'base64url').toString('utf8'));
    return { ok: true, langId, taskId };
  } catch (err) {
    return { ok: false };
  }
};

const buildTaskCreate = ({ db }) => async task => {
  const { lang, code } = task;
  const langId = Number.parseInt(lang);
  const codeHash = createCodeHash(code);

  const codeHashRef = doc(db, 'code-hashes', codeHash);
  const codeHashDoc = await getDoc(codeHashRef);

  let taskId;
  let taskRef;
  if (codeHashDoc.exists()) {
    taskId = codeHashDoc.get('taskId');
    taskRef = doc(db, 'tasks', taskId)
    await updateDoc(taskRef, { count: increment(1) })
  } else {
    const tasksCol = collection(db, 'tasks');
    const task = { lang, code, codeHash, count: 1 };
    const taskRef = await addDoc(tasksCol, task);
    taskId = taskRef.id;
    await setDoc(codeHashRef, { taskId });
  }
  return encodeFirestoreId({ langId, taskId });
};

const buildTaskFindById = ({ db }) => async id => {
  const { ok, taskId } = decodeFirestoreId(id);
  if (!ok) {
    throw new NotFoundError('failed to parse id');
  }

  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  if (!taskDoc.exists()) {
    throw new NotFoundError('taskId does not exist');
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
