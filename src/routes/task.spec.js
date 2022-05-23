const request = require("supertest");
const { createApp } = require("../app");
const { TASK1, TASK2, TASK_ID1, TASK_ID2 } = require("../testing/fixture");
const { createError, createErrorResponse, createSuccessResponse } = require("./utils");

describe("/task endpoint", () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  it("POST /task", async () => {
    await request(app)
      .post("/task")
      .send({ task: TASK1 })
      .expect(200, createSuccessResponse({ id: TASK_ID1 }));
  });

  it("POST /task {task:[]}", async () => {
    await request(app)
      .post("/task")
      .send({ task: [TASK1, TASK2] })
      .expect(200, createSuccessResponse({ id: [TASK_ID1, TASK_ID2] }));
  });

  it("GET /task no ids", async () => {
    await request(app)
      .get(`/task`)
      .expect(400, createErrorResponse(createError(400, "must provide at least one id")));
  });

  it("GET /task", async () => {
    await request(app).post("/task").send({ task: TASK1 });

    await request(app)
      .get(`/task?id=${[TASK_ID1].join(",")}`)
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("GET /task?id=[]", async () => {
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
