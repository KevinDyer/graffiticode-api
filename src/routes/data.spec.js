const request = require("supertest");
const { createApp } = require("../app");
const { buildArtCompilerAuthApplication } = require("../testing/auth");
const { clearFirestore } = require("../testing/firestore");
const { TASK1, DATA1, DATA2, TASK2 } = require("../testing/fixture");
const { createSuccessResponse } = require("./utils");

describe.each(["memory", "firestore"])("/data[%s]", (storageType) => {
  beforeEach(async () => {
    await clearFirestore();
  });

  let authApp;
  let authServer;
  let app;
  beforeEach(async () => {
    authApp = buildArtCompilerAuthApplication();
    await new Promise(resolve => authServer = authApp.listen(resolve));
    app = createApp({ authUrl: `http://localhost:${authServer.address().port}` });
  });

  afterEach((done) => {
    authServer.close(done);
  });

  it("get single data", async () => {
    const res = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/data")
      .set("x-graffiticode-storage-type", storageType)
      .query({ id })
      .expect(200, createSuccessResponse(DATA1));
  });

  it("get multiple datas", async () => {
    const res1 = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK1 })
      .expect(200);
    expect(res1).toHaveProperty("body.status", "success");
    const id1 = res1.body.data.id;
    const res2 = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK2 });
    expect(res2).toHaveProperty("body.status", "success");
    const id2 = res2.body.data.id;

    await request(app)
      .get("/data")
      .set("x-graffiticode-storage-type", storageType)
      .query({ id: [id1, id2].join(",") })
      .expect(200, createSuccessResponse([DATA1, DATA2]));
  });

  it("get data for different storage type", async () => {
    const createResponse = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "firestore")
      .send({ task: TASK1 })
      .expect(200);
    expect(createResponse).toHaveProperty("body.status", "success");
    const id = createResponse.body.data.id;

    await request(app)
      .get("/data")
      .set("x-graffiticode-storage-type", "memory")
      .query({ id })
      .expect(404);
  });

  it("get data with token created with token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .set("Authorization", token)
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/data")
      .set("Authorization", token)
      .set("x-graffiticode-storage-type", storageType)
      .query({ id })
      .expect(200, createSuccessResponse(DATA1));
  });

  it("get data with token created without token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/data")
      .set("Authorization", token)
      .set("x-graffiticode-storage-type", storageType)
      .query({ id })
      .expect(200, createSuccessResponse(DATA1));
  });

  it("should not get data without token created with token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .set("Authorization", token)
      .set("x-graffiticode-storage-type", storageType)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/data")
      .set("x-graffiticode-storage-type", storageType)
      .query({ id })
      .expect(404);
  });
});
