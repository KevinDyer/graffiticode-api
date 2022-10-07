import { jest } from "@jest/globals";
export const mockCallbackValue = (value) => {
  return jest.fn().mockImplementation((...params) => {
    if (params.length > 0) {
      const resume = params[params.length - 1];
      resume(null, value);
    } else {
      throw new Error('no callback paramter given')
    }
  });
};

export const mockCallbackError = (err) => {
  return jest.fn().mockImplementation((...params) => {
    if (params.length > 0) {
      const resume = params[params.length - 1];
      resume(err);
    } else {
      throw new Error('no callback paramter given')
    }
  });
};
