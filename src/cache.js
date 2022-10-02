const redis = require("redis");

const createKey = (id, type) => `${id}.${type}`;

const buildLocalCacheGet = ({ localCache, delegate }) => async (id, type) => {
  const key = createKey(id, type);
  if (localCache.has(key)) {
    return localCache.get(key);
  }
  if (delegate) {
    return await delegate.get(id, type);
  }
  return null;
};

const buildLocalCacheSet = ({ localCache, delegate }) => async (id, type, value) => {
  const key = createKey(id, type);
  localCache.set(key, value);
  if (delegate) {
    await delegate.set(id, type, value);
  }
};

const buildLocalCacheDel = ({ localCache, delegate }) => async (id, type) => {
  const key = createKey(id, type);
  localCache.delete(key);
  if (delegate) {
    await delegate.set(id, type);
  }
};

const buildLocalCache = ({ delegate }) => {
  const localCache = new Map();
  const get = buildLocalCacheGet({ localCache, delegate });
  const set = buildLocalCacheSet({ localCache, delegate });
  const del = buildLocalCacheDel({ localCache, delegate });
  return { get, set, del };
};

const buildRedisCacheGet = ({ client }) => async (id, type) => {
  const key = createKey(id, type);
  return await client.get(key);
};

const buildRedisCacheSet = ({ client }) => async (id, type, value) => {
  const key = createKey(id, type);
  await client.set(key, value);
};

const buildRedisCacheDel = ({ client }) => async (id, type) => {
  const key = createKey(id, type);
  await client.del(key);
};

const buildRedisCache = ({ }) => {
  const client = redis.createClient({ url: process.env.REDIS_URL });
  const get = buildRedisCacheGet({ client });
  const set = buildRedisCacheSet({ client });
  const del = buildRedisCacheDel({ client });
  return { get, set, del };
};

exports.buildLocalCache = buildLocalCache;
exports.buildRedisCache = buildRedisCache;
exports.cacheApi = buildLocalCache({});
