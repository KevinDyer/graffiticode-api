const express = require("express");
const request = require("supertest");
const { UnauthenticatedError } = require("../errors/http");

const buildAuthHandler = require("./auth");

describe("routes/auth", () => {
  let validateToken;
  let app;
  beforeEach(() => {
    validateToken = jest.fn();

    app = express();
    app.use(buildAuthHandler({ validateToken }));
    app.get("/", (req, res) => res.status(200).json({ auth: req.auth }));
    app.use((err, req, res, next) => {
      console.log(err);
      res.sendStatus(500);
    });
  });

  it("should have null authContext if no auth token", async () => {
    validateToken.mockResolvedValue({ uid: "1" });

    const res = await request(app)
      .get("/")
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", null);
    expect(res.body).toHaveProperty("auth.context", null);
    expect(validateToken).toHaveBeenCalledTimes(0);
  });

  it("should have authContext if auth token", async () => {
    const token = "abc123";
    validateToken.mockResolvedValue({ uid: "1" });

    const res = await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", token);
    expect(res.body).toHaveProperty("auth.context", { uid: "1" });
    expect(validateToken).toHaveBeenCalledWith(token);
  });

  it("should have authContext if auth token with Bearer prefix", async () => {
    const token = "abc123";
    validateToken.mockResolvedValue({ uid: "1" });

    const res = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body).toHaveProperty("auth.token", token);
    expect(res.body).toHaveProperty("auth.context", { uid: "1" });
    expect(validateToken).toHaveBeenCalledWith(token);
  });

  it("should return 401 if invalid token", async () => {
    const token = "abc123";
    validateToken.mockRejectedValue(new UnauthenticatedError("no context for abc123"));

    const res = await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(401);

    expect(res.body).toHaveProperty("error.message", "no context for abc123");
    expect(validateToken).toHaveBeenCalledWith(token);
  });

  it("should return 401 if auth provider fails", async () => {
    const token = "abc123";
    validateToken.mockRejectedValue(new Error("unknown failure"));

    await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(500, "Internal Server Error");

    expect(validateToken).toHaveBeenCalledWith(token);
  });
});
