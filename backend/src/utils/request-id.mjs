import crypto from "node:crypto";

export function getRequestId(request) {
  const headerValue = request.headers["x-request-id"];

  if (typeof headerValue === "string" && headerValue.trim().length > 0) {
    return headerValue.trim();
  }

  return crypto.randomUUID();
}
