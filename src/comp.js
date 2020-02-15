const assert = require('assert');
const {decodeID, encodeID, objectToID, objectFromID} = require('./id');
const {delCache, getCache, setCache} = require('./cache');
const {pingLang, getCompilerVersion} = require('./lang');
const {getCompilerHost, getCompilerPort, parseJSON, cleanAndTrimObj, cleanAndTrimSrc} = require('./util');

const nilID = encodeID([0,0,0]);

function getLang(ids, resume) {
  resume(null, "L" + ids[0]);
}

function getCode(ids, resume) {
  objectFromID(ids[1])
    .then(val => {
      resume(null, val);
    })
    .catch(err => {
      console.log("getCode() err=" + err.stack);
      resume(err);
    });
}

function getData(ids, resume) {
  if (encodeID(ids) === nilID || ids.length === 3 && +ids[2] === 0) {
    resume(null, {});
  } else {
    ids = ids.slice(2);
    assert(ids.length === 3);
    assert(ids[0] === 113);   // L113 code is stored as data not an AST.
    objectFromID(ids[1])
      .then(val => {
        resume(null, val);
      })
      .catch(err => {
        console.log("getData() err=" + err);
        console.trace();
        resume(err);
      });
  }
}

function compileID(auth, id, options, resume) {
  let refresh = options.refresh;
  let dontSave = options.dontSave;
  if (id === nilID) {
    resume(null, {});
  } else {
    let ids = decodeID(id);
    if (refresh) {
      delCache(id, "data");
    }
    getCache(id, "data", (err, val) => {
      if (val) {
        // Got cached value. We're done.
        resume(err, val);
      } else {
        getData(ids, (err, data) => {
          getCode(ids, (err, code) => {
            if (err && err.length) {
              resume(err, null);
            } else {
              getLang(ids, (err, lang) => {
                if (err && err.length) {
                  resume(err, null);
                } else {
                  if (code && code.root) {
                    assert(code && code.root !== undefined, "Invalid code for item " + ids[1]);
                    // Let downstream compilers know they need to refresh
                    // any data used.
                    comp(auth, lang, code, data, options, (err, obj) => {
                      if (err) {
                        resume(err);
                      } else {
                        // TODO cache id => obj.
                        setCache(lang, id, "data", obj);
                        resume(null, obj);
                      }
                    });
                  } else {
                    // Error handling here.
                    console.log("ERROR compileID() ids=" + ids + " missing code");
                    resume(null, {});
                  }
                }
              });
            }
          });
        });
      }
    });
  }
}

function comp(auth, lang, code, data, options, resume) {
  pingLang(lang, pong => {
    if (pong) {
      // Compile ast to obj.
      var path = "/compile";
      var encodedData = JSON.stringify({
        code: code,
        data: data,
        options: options,
        auth: auth,
      });
      var reqOptions = {
        host: getCompilerHost(lang, global.config),
        port: getCompilerPort(lang, global.config),
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(encodedData),
        },
      };
      var req = global.protocol.request(reqOptions, function(res) {
        var data = "";
        res.on('data', function (chunk) {
          data += chunk;
        });
        res.on('end', function () {
          let err;
          if (res.statusCode !== 200) {
            err = [{
              statusCode: res.statusCode,
              data: data,
            }];
          }
          const val = parseJSON(data);
          resume(err, val);
        });
        res.on('error', function (err) {
          console.log("[1] comp() ERROR " + err);
          resume([{
            statusCode: 500,
            data: data,
          }]);
        });
      });
      req.write(encodedData);
      req.end();
      req.on('error', function(err) {
        console.log("[2] comp() ERROR " + err);
        resume(408);
      });
    } else {
      resume(404);
    }
  });
}

function getIDFromType(type) {
  switch (type) {
  default:
    return null;
  }
}

function verifyCode(code) {
  // Return code if valid, otherwise return null.
  // TODO verify code.
  return code;
}

function compile(auth, item) {
  // item = {
  //   lang,
  //   code,
  //   data,
  //   options,
  // }
  // where
  //   lang is an integer language identifier,
  //   code is an AST which may or may not be in the AST store, and
  //   data is a JSON object to be passed with the code to the compiler.
  //   options is an object defining various contextual values.
  return new Promise(async (accept, reject) => {
    let langID = item.lang;
    let codeID = await objectToID(verifyCode(item.code));
    let dataID = await objectToID(item.data);
    let dataIDs = dataID === 0 && [0] || [113, dataID, 0];  // L113 is the data language.
    let id = encodeID([langID, codeID].concat(dataIDs));
    let options = item.options || {};
    let t0 = new Date;
    compileID(auth, id, options, (err, obj) => {
      if (err) {
        reject(err);
      } else {
        accept(obj)
      }
    });
  });
}

exports.compileID = compileID;
exports.compile = compile;
