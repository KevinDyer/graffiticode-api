const { createFirestoreDb } = require("../storage/firestore");

exports.clearFirestore = async () => {
  const db = createFirestoreDb({});
  const cols = await db.listCollections();
  await Promise.all(cols.map(c => db.recursiveDelete(c)));
};
