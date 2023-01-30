import request from "supertest";
import { createApp } from "../app.js";
import { buildArtCompilerAuthApplication } from "../testing/auth.js";
import { clearFirestore } from "../testing/firestore.js";
import { TASK1, TASK1_WITH_SRC, TASK2, TASK1_ID, TASK2_ID } from "../testing/fixture.js";
import { createError, createErrorResponse, createSuccessResponse } from "./utils.js";

describe("routes/task", () => {
  beforeEach(async () => {
    await clearFirestore();
  });

  let authApp;
  let authServer;
  let app;
  beforeEach(async () => {
    authApp = buildArtCompilerAuthApplication();
    await new Promise(resolve => {
      authServer = authApp.listen(resolve);
    });
    app = createApp({ authUrl: `http://localhost:${authServer.address().port}` });
  });

  afterEach((done) => {
    authServer.close(done);
  });

  it("should create a task", async () => {
    await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "ephemeral")
      .send({ task: TASK1 })
      .expect(200, createSuccessResponse({ id: TASK1_ID }));
  });

  it("should create a task with source code", async () => {
    await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "ephemeral")
      .send({ task: TASK1_WITH_SRC })
      .expect(200, createSuccessResponse({ id: TASK1_ID }));
  });

  it("should create multiple tasks", async () => {
    await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "ephemeral")
      .send({ task: [TASK1, TASK2] })
      .expect(200, createSuccessResponse({ id: [TASK1_ID, TASK2_ID] }));
  });

  it("should handle no task ids", async () => {
    await request(app)
      .get("/task")
      .expect(400, createErrorResponse(createError(400, "must provide at least one id")));
  });

  it("should get a task that has been created", async () => {
    const res = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "ephemeral")
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .query({ id })
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("should get a task that has been created from source", async () => {
    const res = await request(app)
      .post("/task")
      .set("x-graffiticode-storage-type", "ephemeral")
      .send({ task: TASK1_WITH_SRC })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .query({ id })
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("should get a task with token that has been created with token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .set("Authorization", token)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .set("Authorization", token)
      .query({ id })
      .expect(200, createSuccessResponse([TASK1]));
  });

  it("should return not found for a task that has been created with token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .set("Authorization", token)
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .query({ id })
      .expect(404);
  });

  it("should get a task with token that has been created without a token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);
    const res = await request(app)
      .post("/task")
      .send({ task: TASK1 })
      .expect(200);
    expect(res).toHaveProperty("body.status", "success");
    const id = res.body.data.id;

    await request(app)
      .get("/task")
      .set("Authorization", token)
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
      .set("x-graffiticode-storage-type", "persistent")
      .send({ task: TASK1 });
    expect(createResponse).toHaveProperty("body.status", "success");
    const id = createResponse.body.data.id;

    await request(app)
      .get("/task")
      .query({ id })
      .set("x-graffiticode-storage-type", "persistent")
      .expect(200, createSuccessResponse([TASK1]));
  });
});
