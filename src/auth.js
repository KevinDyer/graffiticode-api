import bent from "bent";
import https from "https";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { NotFoundError, UnauthenticatedError } from "./errors/http.js";

const buildArtCompilerValidateToken = ({ authUrl = "https://auth.artcompiler.com" }) => {
  // Note: The ArtCompiler application will respond with either a
  // - 401 Unauthenticated
  // - 200 OK with a body containing the user id.
  const postAuth = bent(authUrl, "POST", 200, 401);
  return async token => {
    const res = await postAuth("/validateSignIn", { jwt: token });
    if (res.statusCode === 401) {
      const message = await res.text();
      throw new UnauthenticatedError(message);
    } else if (res.statusCode === 200) {
      const { id } = await res.json();
      if (!Number.isInteger(id)) {
        console.log(`Auth service provided non-integer id: ${id}(${typeof id})`);
        throw new UnauthenticatedError("invalid user id");
      }
      return { uid: id.toString() };
    } else {
      const message = await res.text();
      throw new Error(message);
    }
  };
};

const buildGraffiticodeValidateToken = ({ authUrl = "https://auth.graffiticode.com" }) => {
  const JWKS = createRemoteJWKSet(new URL(`${authUrl}/certs`));
  return async token => {
    try {
      const { payload: { sub: uid } } = await jwtVerify(token, JWKS, { issuer: "urn:graffiticode:auth" });
      return { uid };
    } catch (err) {
      if (["ERR_JWT_EXPIRED", "ERR_JWT_CLAIM_VALIDATION_FAILED", "ERR_JWS_SIGNATURE_VERIFICATION_FAILED"].includes(err.code)) {
        throw new UnauthenticatedError();
      }
      throw new Error(`failed to verify JWT: ${err.code}`);
    }
  };
};

export const buildValidateTokenFactory = ({ authUrl }) => {
  const validateTokenProviders = new Map();
  validateTokenProviders.set("artcompiler", buildArtCompilerValidateToken({ authUrl }));
  validateTokenProviders.set("graffiticode", buildGraffiticodeValidateToken({ authUrl }));
  return ({ authProvider }) => {
    if (!validateTokenProviders.has(authProvider)) {
      throw new NotFoundError(`Auth provider ${authProvider} does not exist`);
    }
    return validateTokenProviders.get(authProvider);
  };
};

export const buildValidateToken = ({ authUrl = "https://auth.artcompiler.com", authProvider = "artcompiler" }) => buildValidateTokenFactory({ authUrl })({ authProvider });

export function postAuth(path, data, resume) {
  const encodedData = JSON.stringify(data);
  const options = {
    host: "auth.artcompiler.com",
    port: "443",
    path,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": Buffer.byteLength(encodedData)
    }
  };
  const req = https.request(options);
  req.on("response", (res) => {
    let data = "";
    res.on("data", function (chunk) {
      data += chunk;
    }).on("end", function () {
      if (res.statusCode === 401) {
        resume(res.statusCode, data);
      } else {
        try {
          data = JSON.parse(data);
          resume(data.error, data);
        } catch (e) {
          console.log("[11] ERROR " + data + " statusCode=" + res.statusCode);
          console.log(e.stack);
        }
      }
    }).on("error", function () {
      console.log("error() status=" + res.statusCode + " data=" + data);
    });
  });
  req.end(encodedData);
  req.on("error", function (err) {
    console.log("[12] ERROR " + err);
    resume(err);
  });
}
