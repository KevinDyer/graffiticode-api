const errorHandler = require('errorhandler');
const express = require('express');
const methodOverride = require('method-override');
const morgan = require('morgan');

const { buildLocalCache } = require('./cache');
const { buildCompileId } = require('./comp');
const { buildDataApi } = require('./data');
const { compile: langCompile } = require('./lang');
const routes = require('./routes');
const { buildTaskDaoFactory } = require('./storage');

const port = global.port = process.env.PORT || 3100;
const env = process.env.NODE_ENV || 'development';

require('events').EventEmitter.defaultMaxListeners = 15;

// This line is required to ensure the typescript compiler moves the default
// config into the build directory.
// TODO(kevindyer) Refactor the creation of the app to inject the config
require('./../config/config.json');

global.config = require(process.env.CONFIG || './../config/config.json');
global.config.useLocalCompiles = process.env.LOCAL_COMPILES === 'true';

const createApp = () => {
  const taskDaoFactory = buildTaskDaoFactory();
  const cache = buildLocalCache({});
  const compileId = buildCompileId({ taskDaoFactory, cache, langCompile });
  const dataApi = buildDataApi({ compileId });

  const app = express();
  app.all('*', (req, res, next) => {
    if (req.headers.host.match(/^localhost/) === null) {
      if (req.headers['x-forwarded-proto'] !== 'https' && env === 'production') {
        console.log('app.all redirecting headers=' + JSON.stringify(req.headers, null, 2) + ' url=' + req.url);
        res.redirect(['https://', req.headers.host, req.url].join(''));
      } else {
        next();
      }
    } else {
      next();
    }
  });

  if (env === 'development') {
    app.use(morgan('dev'));
    app.use(errorHandler({ dumpExceptions: true, showStack: true }));
  } else {
    app.use(morgan('combined', {
      skip: (req, res) => res.statusCode < 400,
    }));
  }
  app.use(express.json({ limit: '50mb' }));
  app.use(methodOverride());
  app.use(routes.proxyHandler);

  // Routes
  app.use('/', routes.root());
  app.use('/compile', routes.compile({ taskDaoFactory, dataApi }));
  app.use('/data', routes.data({ dataApi }));
  app.use('/task', routes.task({ taskDaoFactory }));
  app.use('/lang', routes.langRouter);
  app.use('/config', routes.configHandler);
  app.use('/L*', routes.langRouter);

  // Error handling
  app.use((err, req, res, next) => {
    console.log(err.stack);
    res.sendStatus(500);
  });

  return app;
};

exports.createApp = createApp;

if (!module.parent) {
  const app = createApp();
  app.listen(port, () => {
    console.log(`Listening on ${port}...`);
  });

  process.on('uncaughtException', (err) => {
    console.log(`ERROR Caught exception: ${err.stack}`);
  });
}
