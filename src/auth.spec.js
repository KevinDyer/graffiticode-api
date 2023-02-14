import { describe } from "@jest/globals";
import { createAppWithMemoryStorage } from "@graffiticode/auth/src/app";
import { buildValidateToken, buildValidateTokenFactory } from "./auth.js";
import { buildArtCompilerAuthApplication } from "./testing/auth.js";

describe("auth", () => {
  let authApp;
  let authServer;
  let authUrl;
  beforeEach(async () => {
    authApp = buildArtCompilerAuthApplication();
    await new Promise(resolve => {
      authServer = authApp.listen(resolve);
    });
    authUrl = `http://localhost:${authServer.address().port}`;
  });

  afterEach((done) => {
    authServer.close(done);
  });

  describe.each(["artcompiler", "graffiticode"])("ValidateToken[%s]", (authProvider) => {
    let validateToken;
    beforeEach(() => {
      validateToken = buildValidateToken({ authUrl, authProvider });
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

  describe("ArtCompiler", () => {
    let validateToken;
    beforeEach(() => {
      validateToken = buildValidateToken({ authUrl, authProvider: "artcompiler" });
    });

    it("should return uid from auth app", async () => {
      const token = "abc123";
      authApp.addIdForToken(token, 1);

      await expect(validateToken(token)).resolves.toStrictEqual({ uid: "1" });
    });
  });

  describe("Graffiticode", () => {
    let gcAuth;
    let gcAuthServer;
    let validateToken;
    beforeEach(async () => {
      const gcAuthDeps = createAppWithMemoryStorage();
      gcAuth = gcAuthDeps.auth;

      await new Promise(resolve => {
        gcAuthServer = gcAuthDeps.app.listen(resolve);
      });

      authUrl = `http://localhost:${gcAuthServer.address().port}`;
      validateToken = buildValidateToken({ authUrl, authProvider: "graffiticode" });
    });

    afterEach((done) => {
      gcAuthServer.close(done);
    });

    it("should return uid from auth app", async () => {
      const { accessToken: token } = await gcAuth.generateTokens({ uid: "1" });

      await expect(validateToken(token)).resolves.toStrictEqual({ uid: "1" });
    });
  });

  describe("ValidateTokenFactory", () => {
    const factory = buildValidateTokenFactory({ authUrl });

    it("should return ArtCompiler validateToken", () => {
      factory({ authProvider: "artcompiler" });
    });

    it("should return Graffiticode validateToken", () => {
      factory({ authProvider: "graffiticode" });
    });

    it("should throw for unknown provider", () => {
      expect(() => factory({ authProvider: "foo" })).toThrow();
    });
  });
});
