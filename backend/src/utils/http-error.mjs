export class HttpError extends Error {
  constructor(statusCode, message, code = null, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends HttpError {
  constructor(message, details = null, code = "VALIDATION_ERROR") {
    super(400, message, code, details);
    this.name = "ValidationError";
  }
}
