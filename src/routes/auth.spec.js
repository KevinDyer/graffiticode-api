const express = require("express");
const request = require("supertest");
const { buildFakeAuthProvider, buildArtCompilerAuthApplication } = require("../testing/auth");

const buildAuthHandler = require("./auth");

describe("routes/auth", () => {
  let authProvider;
  let app;
  beforeEach(() => {
    authProvider = buildFakeAuthProvider();

    app = express();
    app.use(buildAuthHandler({ authProvider }));
    app.get("/", (req, res) => res.status(200).json({ auth: req.auth }));
    app.use((err, req, res, next) => res.sendStatus(500));
  });

  it("should have null authContext if no auth token", async () => {
    const token = "abc123";
    authProvider.addContextForToken(token, { uid: 1 });

    const res = await request(app)
      .get("/")
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", null);
    expect(res.body).toHaveProperty("auth.context", null);
  });

  it("should have authContext if auth token", async () => {
    const token = "abc123";
    authProvider.addContextForToken(token, { uid: "1" });

    const res = await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", token);
    expect(res.body).toHaveProperty("auth.context", { uid: "1" });
  });

  it("should have authContext if auth token with Bearer prefix", async () => {
    const token = "abc123";
    authProvider.addContextForToken(token, { uid: "1" });

    const res = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", token);
    expect(res.body).toHaveProperty("auth.context", { uid: "1" });
  });

  it("should return 401 if invalid token", async () => {
    const token = "abc123";

    const res = await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(401);

    expect(res.body).toHaveProperty("error.message", "no context for abc123");
  });

  it("should return 401 if auth provider fails", async () => {
    const token = "abc123";
    authProvider.addContextForToken(token, new Error("auth provider failure"));

    await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(500, "Internal Server Error");
  });
});
