const request = require("supertest");
const { createApp } = require("./app");
const { buildArtCompilerAuthApplication } = require("./testing/auth");

describe("api", () => {
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

  it("GET /", (done) => {
    request(app)
      .get("/")
      .expect(200, "OK", done);
  });

  it("GET / with auth token", async () => {
    const token = "abc123";
    authApp.addIdForToken(token, 1);

    await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(200);
  });

  it("GET / with invalid auth token", async () => {
    const token = "abc123";

    await request(app)
      .get("/")
      .set("Authorization", token)
      .expect(401);
  });
});
