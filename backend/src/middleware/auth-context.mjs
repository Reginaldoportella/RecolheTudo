export function getAuthContext(request) {
  const authorization = request.headers.authorization;
  const headerUserId = request.headers["x-user-id"];
  const headerDeviceId = request.headers["x-device-id"];

  return {
    bearerTokenPresent:
      typeof authorization === "string" &&
      authorization.trim().toLowerCase().startsWith("bearer "),
    userId:
      typeof headerUserId === "string" && headerUserId.trim().length > 0
        ? headerUserId.trim()
        : null,
    deviceId:
      typeof headerDeviceId === "string" && headerDeviceId.trim().length > 0
        ? headerDeviceId.trim()
        : null,
    isAuthenticated: false,
  };
}
