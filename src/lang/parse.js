import vm from "vm";
import { getAsset } from "./index.js";
import { parser } from "./parser.js";

let nodePool;

// commonjs export
const main = {
  parse(src, lexicon, resume) {
    const stream = new parser.StringStream(src);
    const state = {
      cc: parser.program, // top level parsing function
      argc: 0,
      argcStack: [0],
      paramc: 0,
      paramcStack: [0],
      env: [{ name: "global", lexicon }],
      exprc: 0,
      exprcStack: [0],
      nodeStack: [],
      nodeStackStack: [],
      nodePool: ["unused"],
      nodeMap: {},
      nextToken: -1,
      errors: [],
      coords: [],
      inStr: 0,
      quoteCharStack: []
    };
    const next = function () {
      return parser.parse(stream, state, resume);
    };
    while (state.cc != null && stream.peek()) {
      next();
      nodePool = state.nodePool;
    }
    if (state.cc) {
      throw new Error("End of program reached.");
    }
    return nodePool;
  }
};

export const buildParse = ({
  log,
  cache,
  getLangAsset,
  main,
  vm
}) => {
  return async function parse(lang, src, resume) {
    new Promise ((resolve, reject) => {
      if (cache.has(lang)) {
        main.parse(src, cache.get(lang), (err, val) => {
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        });
      } else {
        getLangAsset(lang, "lexicon.js", (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          // TODO Make lexicon JSON.
          if (data instanceof Buffer) {
            data = data.toString();
          }
          if (typeof (data) !== "string") {
            log(`Failed to get usable lexicon for ${lang}`, typeof (data), data);
            reject(new Error("unable to use lexicon"));
            return;
          }
          
          const lstr = data.substring(data.indexOf("{"));
          let lexicon;
          try {
            lexicon = JSON.parse(lstr);
          } catch (err) {
            if (err instanceof SyntaxError) {
              log(`failed to parse ${lang} lexicon: ${err.message}`);
              
              const context = { window: { gcexports: {} } };
              vm.createContext(context);
              vm.runInContext(data, context);
              if (typeof (context.window.gcexports.globalLexicon) === "object") {
                lexicon = context.window.gcexports.globalLexicon;
              }
            }
            if (!lexicon) {
              reject(err);
            }
          }
          cache.set(lang, lexicon);
          main.parse(src, lexicon, (err, val) => {
            if (err) {
              reject(err);
            } else {
              resolve(val);
            }
          });
        });
      }
    });
  };
};

export const parse = buildParse({
  log: console.log,
  cache: new Map(),
  getAsset,
  main,
  vm
});
