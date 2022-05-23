
class HttpError extends Error {
  constructor({ code = 500, statusCode = code, message }) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
exports.HttpError = HttpError;

class NotFoundError extends HttpError {
  constructor(message) {
    super({ code: 404, message });
  }
}
exports.NotFoundError = NotFoundError;

class InvalidArgumentError extends HttpError {
  constructor(message) {
    super({ code: 400, message });
  }
}
exports.InvalidArgumentError = InvalidArgumentError;

class DecodeIdError extends HttpError {
  constructor(message) {
    super({ code: 4001, statusCode: 400, message });
  }
}
exports.DecodeIdError = DecodeIdError;
