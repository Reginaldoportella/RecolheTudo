import http from "node:http";

import env from "./config/env.mjs";
import { listCollectionPoints } from "./data/in-memory-store.mjs";
import { initDatabase, inspectState } from "./data/postgres.mjs";
import { getDailySummary, getWeeklySummary } from "./services/analytics-service.mjs";
import { getNearbyCollectionPoints } from "./services/collection-points-service.mjs";
import { getCollections, removeCollection, syncCollections } from "./services/collections-service.mjs";
import { planRoute } from "./services/route-planning-service.mjs";
import { readJsonBody, sendJson } from "./utils/json.mjs";

function notFound(response) {
  sendJson(response, 404, {
    error: "Not Found",
  });
}

function badRequest(response, message) {
  sendJson(response, 400, {
    error: "Bad Request",
    message,
  });
}

const server = http.createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    sendJson(response, 200, { ok: true });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/health" && request.method === "GET") {
      sendJson(response, 200, {
        status: "ok",
        service: "recolhetudo-backend",
        time: new Date().toISOString(),
        state: await inspectState(listCollectionPoints().length),
      });
      return;
    }

    if (pathname === `${env.apiPrefix}/collections/sync` && request.method === "POST") {
      const body = await readJsonBody(request);
      sendJson(response, 200, await syncCollections(body));
      return;
    }

    if (pathname === `${env.apiPrefix}/collections` && request.method === "GET") {
      const limit = Number(url.searchParams.get("limit") ?? 50);
      sendJson(response, 200, {
        items: await getCollections(limit),
      });
      return;
    }

    if (pathname.startsWith(`${env.apiPrefix}/collections/`) && request.method === "DELETE") {
      const remoteId = pathname.split("/").at(-1) ?? "";
      const deleted = await removeCollection(remoteId);
      sendJson(response, deleted ? 200 : 404, {
        deleted,
      });
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/daily-summary` && request.method === "GET") {
      const date = url.searchParams.get("date");

      if (!date) {
        badRequest(response, "Query param date e obrigatorio.");
        return;
      }

      sendJson(response, 200, await getDailySummary(date));
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/weekly-summary` && request.method === "GET") {
      const date = url.searchParams.get("date");

      if (!date) {
        badRequest(response, "Query param date e obrigatorio.");
        return;
      }

      sendJson(response, 200, await getWeeklySummary(date));
      return;
    }

    if (pathname === `${env.apiPrefix}/collection-points/nearby` && request.method === "GET") {
      const latitude = Number(url.searchParams.get("latitude"));
      const longitude = Number(url.searchParams.get("longitude"));
      const radiusMeters = Number(url.searchParams.get("radiusMeters") ?? 3000);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        badRequest(response, "latitude e longitude sao obrigatorios.");
        return;
      }

      sendJson(response, 200, {
        points: getNearbyCollectionPoints(latitude, longitude, radiusMeters),
      });
      return;
    }

    if (pathname === `${env.apiPrefix}/routes/plan` && request.method === "POST") {
      const body = await readJsonBody(request);
      sendJson(response, 200, await planRoute(body));
      return;
    }

    notFound(response);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro inesperado no backend.";

    sendJson(response, 500, {
      error: "Internal Server Error",
      message,
    });
  }
});

await initDatabase();

server.listen(env.port, env.host, () => {
  console.log(`RecolheTudo backend rodando em http://${env.host}:${env.port}`);
});
