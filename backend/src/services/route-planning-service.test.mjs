import test from "node:test";
import assert from "node:assert/strict";

import { planRoute } from "./route-planning-service.mjs";

test("planRoute retorna vazio quando nao ha destinos", async () => {
  const result = await planRoute({
    origin: { latitude: -23.5, longitude: -46.6 },
    destinations: [],
  });

  assert.equal(result.provider, "none");
  assert.equal(result.fallback, false);
  assert.equal(result.orderedPoints.length, 0);
});

test("planRoute faz fallback quando provider externo falha", async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => {
    throw new Error("network down");
  };

  try {
    const result = await planRoute({
      origin: { latitude: -23.5, longitude: -46.6 },
      destinations: [
        { id: "p1", latitude: -23.51, longitude: -46.61 },
      ],
    });

    assert.equal(result.provider, "none");
    assert.equal(result.fallback, true);
    assert.equal(result.orderedPoints.length, 1);
  } finally {
    global.fetch = originalFetch;
  }
});
