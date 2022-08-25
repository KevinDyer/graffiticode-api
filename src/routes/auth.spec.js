const express = require("express");
const request = require("supertest");
const { buildFakeAuthProvider } = require("../testing/auth");

const buildAuthHandler = require('./auth');

describe("routes/auth", () => {
  let authProvider;
  let app;
  beforeEach(() => {
    authProvider = buildFakeAuthProvider();
    app = express();
    app.use(buildAuthHandler({ authProvider }));
    app.get('/', (req, res) => res.status(200).json({
      authToken: req.authToken,
      authContext: req.authContext
    }));
    app.use((err, req, res, next) => {
      console.error(err.stack)
      res.status(500).send('Something broke!')
    });
  });

  it("should have null authContext if no auth token", async () => {
    const token = "abc";
    authProvider.put(token, { uid: 1 });

    const res = await request(app)
      .get("/")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    console.log(res.body);
  });
});
