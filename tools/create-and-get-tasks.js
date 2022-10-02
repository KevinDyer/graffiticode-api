import bent from "bent";
import { TASK1, TASK2 } from "../src/testing/fixture.js";

// const baseUrl = "https://api.graffiticode.org";
const baseUrl = "https://firestore---graffiticode-api-sja7fatcta-uc.a.run.app/";
// const baseUrl = "http://localhost:3100";

const callCreateTask = bent(`${baseUrl}/task`, "POST", "json");
const callGetData = bent(`${baseUrl}/data`, "GET", "json");

const createTask = async ({ task, storageType = "firestore" }) => {
  const res = await callCreateTask("", { task }, { "x-graffiticode-storage-type": storageType });
  if (res.status !== "success") {
    throw new Error(res.error);
  }
  return res.data.id;
};

const getData = async ({ id, storageType = "firestore" }) => {
  const params = new URLSearchParams();
  params.append("id", id);
  const res = await callGetData(`?${params.toString()}`, null, { "x-graffiticode-storage-type": storageType });
  if (res.status !== "success") {
    throw new Error(res.error);
  }
  return res.data;
};

const run = async () => {
  const id1 = await createTask({ task: TASK1 });
  console.log(id1);
  const id2 = await createTask({ task: TASK2 });
  console.log(id2);

  const data1 = await getData({ id: id1 });
  console.log(data1);
  const data2 = await getData({ id: id2 });
  console.log(data2);
  const dataN = await getData({ id: `${id1}+${id2}` });
  console.log(dataN);
};

run().catch(err => {
  if (err.name === "StatusError") {
    console.log(err.headers);
    err.text().then(console.log);
  } else {
    console.log(err);
  }
});
