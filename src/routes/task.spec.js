const fs = require('fs');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const request = require("supertest");
const { createApp } = require("../app");
const { TASK1, TASK2, TASK_ID1, TASK_ID2 } = require("../testing/fixture");
const { createError, createErrorResponse, createSuccessResponse } = require("./utils");

describe("routes/task", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  let testEnv = null;
  beforeEach(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'graffiticode',
      firestore: {
        host: 'localhost',
        port: 8080,
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
      await testEnv.cleanup();
      testEnv = null;
    }
  });

  it("should create a task", async () => {
    await request(app)
      .post("/task")
      .send({ task: TASK1 })
      .expect(200, createSuccessResponse({ id: TASK_ID1 }));
  });

  it("should create multiple tasks", async () => {
    await request(app)
      .post("/task")
      .send({ task: [TASK1, TASK2] })
      .expect(200, createSuccessResponse({ id: [TASK_ID1, TASK_ID2] }));
  });

  it("should handle no task ids", async () => {
    await request(app)
      .get(`/task`)
      .expect(400, createErrorResponse(createError(400, "must provide at least one id")));
  });

  it("should get a task that has been created", async () => {
    await request(app).post("/task").send({ task: TASK1 });

    await request(app)
      .get(`/task?id=${[TASK_ID1].join(",")}`)
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("should get multiple tasks that have been created", async () => {
    await request(app).post("/task").send({ task: TASK1 });
    await request(app).post("/task").send({ task: TASK2 });

    await request(app)
      .get(`/task?id=${[TASK_ID1, TASK_ID2].join(",")}`)
      .expect(200, createSuccessResponse([TASK1, TASK2]));
  });

  it("get from same storage type", async () => {
    const createResponse = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "firestore")
      .send({ task: TASK1 });
    expect(createResponse).toHaveProperty("body.status", "success");
    const id = createResponse.body.data.id;

    await request(app)
      .get(`/task?id=${[id].join(",")}`)
      .set("x-graffiticode-storage-type", "firestore")
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("get from different storage type", async () => {
    const createResponse = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "firestore")
      .send({ task: TASK1 });
    expect(createResponse).toHaveProperty("body.status", "success");
    const id = createResponse.body.data.id;

    await request(app)
      .get(`/task?id=${[id].join(",")}`)
      .set("x-graffiticode-storage-type", "memory")
      .expect(404);
  });

});
