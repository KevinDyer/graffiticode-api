const { decodeID, encodeID } = require('../id');
const { NotFoundError } = require("../errors/http");


const buildObjectToId = ({ idsByObject, objectsById }) => obj => {
  if (obj === null) {
    return 0;
  }
  const key = JSON.stringify(obj);
  if (!idsByObject.has(key)) {
    const newId = objectsById.size + 1;
    idsByObject.set(key, newId);
    objectsById.set(newId, obj);
  }
  return idsByObject.get(key);
}

const buildObjectFromId = ({ objectsById }) => id => objectsById.get(id);

const buildTaskCreate = ({ objectToId }) => async (task) => {
  const langId = task.lang;
  const codeId = objectToId(task.code);
  const id = encodeID([langId, codeId, 0]);
  return id;
};

const buildTaskFindById = ({ objectFromId }) => async (id) => {
  const [langId, codeId] = decodeID(id);
  const lang = langId.toString();
  const code = objectFromId(codeId);
  if (!code) {
    throw new NotFoundError();
  }
  const task = { lang, code };
  return task;
};

const buildMemoryTaskDao = () => {
  const idsByObject = new Map([[JSON.stringify({}), 1]]);
  const objectsById = new Map([[1, {}]]);

  const objectToId = buildObjectToId({ idsByObject, objectsById });
  const objectFromId = buildObjectFromId({ objectsById });

  const create = buildTaskCreate({ objectToId });
  const findById = buildTaskFindById({ objectFromId });
  return { create, findById };
};
exports.buildMemoryTaskDao = buildMemoryTaskDao;
