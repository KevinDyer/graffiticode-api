
const buildFakeAuthProvider = () => {
  const contextsByToken = new Map();
  return {
    put: (token, context) => contextsByToken.set(token, context),
    clear: token => contextsByToken.clear(token),
    auth: async token => {
      if (!contextsByToken.has(token)) {
        // Unauthenticated
        throw new Error('401 User is not authenticated');
      }
      return authByToken.get(token);
    },
  };
};
exports.buildFakeAuthProvider = buildFakeAuthProvider;
