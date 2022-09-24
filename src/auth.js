const bent = require("bent");
const https = require("https");
const { UnauthenticatedError } = require("./errors/http");

exports.buildAuthProvider = ({ authUrl = "https://auth.artcompiler.com" }) => {
  // Note: The ArtCompiler application will respond with either a 401 Unauthenticated
  // or a 200 OK with a body containing the user id.
  const postAuth = bent(authUrl, "POST", 200, 401, 404);
  return {
    // signIn: ({ number, name }) => postAuth("/signIn", { number, name }),
    // finishSignIn: ({ jwt, passcode }) => postAuth("/finishSignIn", { jwt, passcode }),
    validate: async token => {
      const res = await postAuth("/validateSignIn", { jwt: token });
      if (res.statusCode === 401 || res.statusCode === 404) {
        throw new UnauthenticatedError();
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
    },
  };
};

function postAuth(path, data, resume) {
  let encodedData = JSON.stringify(data);
  var options = {
    host: "auth.artcompiler.com",
    port: "443",
    path: path,
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": Buffer.byteLength(encodedData),
    },
  };
  var req = https.request(options);
  req.on("response", (res) => {
    var data = "";
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
exports.postAuth = postAuth;
