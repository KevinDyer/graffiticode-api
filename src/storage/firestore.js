const { createHash } = require("crypto");
const { NotFoundError, DecodeIdError } = require("../errors/http");
const { initializeApp } = require("@firebase/app");
const {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  increment,
  setDoc,
  updateDoc,
} = require("@firebase/firestore");

const createCodeHash = code =>
  createHash("sha256")
    .update(JSON.stringify(code))
    .digest("hex");

const encodeId = ({ taskIds }) => {
  const idObj = { taskIds };
  return Buffer.from(JSON.stringify(idObj), "utf8").toString("base64url");
}
exports.encodeId = encodeId;

const decodeIdPart = id => {
  let taskIds;
  try {
    const idObj = JSON.parse(Buffer.from(id, "base64url").toString("utf8"));
    taskIds = idObj.taskIds;
  } catch (err) {
    throw new DecodeIdError(`failed to decode firestore id ${id}: ${err.message}`);
  }
  if (!Array.isArray(taskIds) || taskIds.length < 1) {
    throw new DecodeIdError(`firestore id ${id} contains no taskIds`);
  }
  return taskIds;
};

const decodeId = id => {
  const idParts = id.split("+");
  const taskIds = idParts.reduce(
    (taskIds, idPart) => {
      const idPartTaskIds = decodeIdPart(idPart);
      taskIds.push(...idPartTaskIds);
      return taskIds;
    },
    [],
  );
  return taskIds;
};

const appendIds = (id, ...otherIds) => {
  const taskIds = decodeId(id);
  otherIds.forEach(otherId => {
    const otherTaskIds = decodeId(otherId);
    taskIds.push(...otherTaskIds);
  });
  return encodeId({ taskIds });
}

const buildTaskCreate = ({ db }) => async task => {
  const { lang, code } = task;
  const codeHash = createCodeHash(code);

  const codeHashRef = doc(db, "code-hashes", codeHash);
  const codeHashDoc = await getDoc(codeHashRef);

  let taskId;
  let taskRef;
  if (codeHashDoc.exists()) {
    taskId = codeHashDoc.get("taskId");
    taskRef = doc(db, "tasks", taskId);
    await updateDoc(taskRef, { count: increment(1) });
  } else {
    const tasksCol = collection(db, "tasks");
    const task = { lang, code, codeHash, count: 1 };
    const taskRef = await addDoc(tasksCol, task);
    taskId = taskRef.id;
    await setDoc(codeHashRef, { taskId });
  }
  return encodeId({ taskIds: [taskId] });
};

const buildTaskGet = ({ db }) => async id => {
  const taskIds = decodeId(id);
  const tasks = await Promise.all(
    taskIds.map(async taskId => {
      const taskRef = doc(db, "tasks", taskId);
      const taskDoc = await getDoc(taskRef);
      if (!taskDoc.exists()) {
        throw new NotFoundError("taskId does not exist");
      }
      const lang = taskDoc.get("lang");
      const code = taskDoc.get("code");
      return { lang, code };
    })
  );
  return tasks;
};

const buildFirestoreTaskDao = ({ db }) => {
  const create = buildTaskCreate({ db });
  const get = buildTaskGet({ db });
  return { create, get, appendIds };
};
exports.buildFirestoreTaskDao = buildFirestoreTaskDao;

const createFirestoreDb = ({ }) => {
  const firebaseConfig = {
    apiKey: "AIzaSyAoVuUNi8ElnS7cn6wc3D8XExML-URLw0I",
    authDomain: "graffiticode.firebaseapp.com",
    databaseURL: "https://graffiticode.firebaseio.com",
    projectId: "graffiticode",
    storageBucket: "graffiticode.appspot.com",
    messagingSenderId: "656973052505",
    appId: "1:656973052505:web:f3f3cc6397a844599c8f48",
    measurementId: "G-KRPK1CDB19",
  };
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  if (process.env.NODE_ENV !== "production") {
    connectFirestoreEmulator(db, "localhost", 8080);
  }
  return db;
};
exports.createFirestoreDb = createFirestoreDb;
