import test from "node:test";
import assert from "node:assert/strict";

import { getNearbyCollectionPoints } from "./collection-points-service.mjs";

test("getNearbyCollectionPoints filtra por material e limite", () => {
  const result = getNearbyCollectionPoints(-23.55052, -46.633308, 10000, "plastic", 1);

  assert.equal(result.length, 1);
  assert.match(result[0].materialType, /plastic/i);
});
