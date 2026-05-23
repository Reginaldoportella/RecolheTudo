import test from "node:test";
import assert from "node:assert/strict";

import { initDatabase, isDatabaseReady } from "./postgres.mjs";

test("isDatabaseReady responde true com banco inicializado", async () => {
  await initDatabase();
  const ready = await isDatabaseReady();
  assert.equal(ready, true);
});
