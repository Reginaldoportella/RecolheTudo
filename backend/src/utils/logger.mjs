function safeSerialize(value) {
  return JSON.stringify(value, (_key, currentValue) => {
    if (currentValue instanceof Error) {
      return {
        name: currentValue.name,
        message: currentValue.message,
        stack: currentValue.stack,
      };
    }

    return currentValue;
  });
}

export function logInfo(event, payload = {}) {
  console.log(safeSerialize({
    level: "info",
    event,
    time: new Date().toISOString(),
    ...payload,
  }));
}

export function logError(event, payload = {}) {
  console.error(safeSerialize({
    level: "error",
    event,
    time: new Date().toISOString(),
    ...payload,
  }));
}
