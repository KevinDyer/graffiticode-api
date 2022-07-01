const request = require("supertest");
const { createApp } = require("../app");
const { TASK1, TASK2, TASK_ID1, TASK_ID2 } = require("../testing/fixture");
const { createError, createErrorResponse, createSuccessResponse } = require("./utils");

describe("routes/task", () => {
  let app;
  beforeAll(() => {
    app = createApp();
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
      .get("/task")
      .expect(400, createErrorResponse(createError(400, "must provide at least one id")));
  });

  it("should get a task that has been created", async () => {
    const res = await request(app).post("/task").send({ task: TASK1 });
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .query({ id })
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("should get multiple tasks that have been created", async () => {
    const res1 = await request(app).post("/task").send({ task: TASK1 });
    expect(res1).toHaveProperty("body.status", "success");
    const id1 = res1.body.data.id;
    const res2 = await request(app).post("/task").send({ task: TASK2 });
    expect(res2).toHaveProperty("body.status", "success");
    const id2 = res2.body.data.id;

    await request(app)
      .get("/task")
      .query({ id: [id1, id2].join(",") })
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
      .get("/task")
      .query({ id })
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
      .get("/task")
      .query({ id })
      .set("x-graffiticode-storage-type", "memory")
      .expect(404);
  });

});
