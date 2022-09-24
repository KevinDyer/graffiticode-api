const { buildAuthProvider } = require("./auth");
const { buildFakeAuthProvider, buildArtCompilerAuthApplication } = require("./testing/auth");

describe("auth", () => {
  describe("provider", () => {
    let authApp;
    let authServer;
    let authProvider;
    beforeEach(async () => {
      authApp = buildArtCompilerAuthApplication();
      await new Promise(resolve => {
        authServer = authApp.listen(resolve);
      });
      authProvider = buildAuthProvider({
        authUrl: `http://localhost:${authServer.address().port}`,
      });
    });

    afterEach((done) => {
      authServer.close(done);
    });

    it("should return uid from auth app", async () => {
      const token = "abc123";
      authApp.addIdForToken(token, 1);

      await expect(authProvider.validate(token)).resolves.toStrictEqual({ uid: "1" });
    });

    it("should reject for missing token", async () => {
      const token = "abc123";

      await expect(authProvider.validate(token)).rejects.toThrow();
    });
  });
});