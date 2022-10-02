const { buildValidateToken } = require("./auth");
const { buildArtCompilerAuthApplication } = require("./testing/auth");

describe("auth", () => {
  describe("validateToken", () => {
    let authApp;
    let authServer;
    let validateToken;
    beforeEach(async () => {
      authApp = buildArtCompilerAuthApplication();
      await new Promise(resolve => {
        authServer = authApp.listen(resolve);
      });
      validateToken = buildValidateToken({
        authUrl: `http://localhost:${authServer.address().port}`
      });
    });

    afterEach((done) => {
      authServer.close(done);
    });

    it("should return uid from auth app", async () => {
      const token = "abc123";
      authApp.addIdForToken(token, 1);

      await expect(validateToken(token)).resolves.toStrictEqual({ uid: "1" });
    });

    it("should reject for missing token", async () => {
      const token = "abc123";

      await expect(validateToken(token)).rejects.toThrow();
    });

    it("should reject if auth app rejects", async () => {
      const token = "abc123";
      authApp.addIdForToken(token, new Error("unknown auth error"));

      await expect(validateToken(token)).rejects.toThrow();
    });
  });
});
