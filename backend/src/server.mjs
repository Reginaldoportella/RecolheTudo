import http from "node:http";

import env from "./config/env.mjs";
import { getAuthContext } from "./middleware/auth-context.mjs";
import { listCollectionPoints } from "./data/in-memory-store.mjs";
import { initDatabase, inspectState, isDatabaseReady } from "./data/postgres.mjs";
import {
  getAnalyticsMaterials,
  getAnalyticsProductivity,
  getAnalyticsSummary,
  getDailySummary,
  getWeeklySummary,
} from "./services/analytics-service.mjs";
import { getNearbyCollectionPoints } from "./services/collection-points-service.mjs";
import { syncCollectionsV2 } from "./services/collections-service.mjs";
import { planRoute } from "./services/route-planning-service.mjs";
import { validateAnalyticsQuery } from "./schemas/analytics-schema.mjs";
import { JsonBodyParseError, readJsonBody, sendJson } from "./utils/json.mjs";
import { HttpError } from "./utils/http-error.mjs";
import { logError, logInfo } from "./utils/logger.mjs";
import { getRequestId } from "./utils/request-id.mjs";

function sendJsonWithRequestId(response, requestId, statusCode, payload) {
  sendJson(response, statusCode, payload, {
    "X-Request-Id": requestId,
  });
}

function notFound(response, requestId) {
  sendJsonWithRequestId(response, requestId, 404, {
    error: "Not Found",
    requestId,
  });
}

function badRequest(response, requestId, message) {
  sendJsonWithRequestId(response, requestId, 400, {
    error: "Bad Request",
    message,
    requestId,
  });
}

function gone(response, requestId, message) {
  sendJsonWithRequestId(response, requestId, 410, {
    error: "Gone",
    message,
    requestId,
  });
}

const server = http.createServer(async (request, response) => {
  const startedAt = Date.now();
  const requestId = getRequestId(request);
  const auth = getAuthContext(request);
  response.setHeader("X-Request-Id", requestId);

  if (request.method === "OPTIONS") {
    sendJsonWithRequestId(response, requestId, 200, {
      ok: true,
      requestId,
    });
    return;
  }

  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
  const pathname = url.pathname;

  try {
    if (pathname === "/health" && request.method === "GET") {
      sendJsonWithRequestId(response, requestId, 200, {
        status: "ok",
        service: "recolhetudo-backend",
        time: new Date().toISOString(),
        state: await inspectState(listCollectionPoints().length),
        requestId,
      });
      return;
    }

    if (pathname === "/ready" && request.method === "GET") {
      await isDatabaseReady();
      sendJsonWithRequestId(response, requestId, 200, {
        status: "ready",
        service: "recolhetudo-backend",
        time: new Date().toISOString(),
        requestId,
      });
      return;
    }

    if (pathname === `${env.apiPrefix}/collections/sync` && request.method === "POST") {
      gone(
        response,
        requestId,
        "Endpoint legado removido. Use POST /v1/sync.",
      );
      return;
    }

    if (pathname === `${env.apiPrefix}/sync` && request.method === "POST") {
      const body = await readJsonBody(request);
      sendJsonWithRequestId(response, requestId, 200, await syncCollectionsV2(body));
      return;
    }

    if (pathname === `${env.apiPrefix}/collections` && request.method === "GET") {
      gone(
        response,
        requestId,
        "Endpoint legado indisponivel sem autenticacao. Use POST /v1/sync para sincronizacao.",
      );
      return;
    }

    if (pathname.startsWith(`${env.apiPrefix}/collections/`) && request.method === "DELETE") {
      gone(
        response,
        requestId,
        "Endpoint legado indisponivel. Exclusoes devem seguir pelo POST /v1/sync.",
      );
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/daily-summary` && request.method === "GET") {
      const date = url.searchParams.get("date");

      if (!date) {
        badRequest(response, requestId, "Query param date e obrigatorio.");
        return;
      }

      sendJsonWithRequestId(response, requestId, 200, await getDailySummary(date));
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/weekly-summary` && request.method === "GET") {
      const date = url.searchParams.get("date");

      if (!date) {
        badRequest(response, requestId, "Query param date e obrigatorio.");
        return;
      }

      sendJsonWithRequestId(response, requestId, 200, await getWeeklySummary(date));
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/summary` && request.method === "GET") {
      const { period, date } = validateAnalyticsQuery(url.searchParams);
      sendJsonWithRequestId(
        response,
        requestId,
        200,
        await getAnalyticsSummary(period, date),
      );
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/materials` && request.method === "GET") {
      const { period, date } = validateAnalyticsQuery(url.searchParams);
      sendJsonWithRequestId(
        response,
        requestId,
        200,
        await getAnalyticsMaterials(period, date),
      );
      return;
    }

    if (pathname === `${env.apiPrefix}/analytics/productivity` && request.method === "GET") {
      const { period, date } = validateAnalyticsQuery(url.searchParams);
      sendJsonWithRequestId(
        response,
        requestId,
        200,
        await getAnalyticsProductivity(period, date),
      );
      return;
    }

    if (pathname === `${env.apiPrefix}/collection-points/nearby` && request.method === "GET") {
      const latitude = Number(
        url.searchParams.get("lat") ?? url.searchParams.get("latitude"),
      );
      const longitude = Number(
        url.searchParams.get("lng") ?? url.searchParams.get("longitude"),
      );
      const radiusMeters = Number(
        url.searchParams.get("radius") ?? url.searchParams.get("radiusMeters") ?? 3000,
      );
      const material = url.searchParams.get("material");
      const limit = Number(url.searchParams.get("limit") ?? 20);

      if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        badRequest(response, requestId, "latitude e longitude sao obrigatorios.");
        return;
      }

      sendJsonWithRequestId(response, requestId, 200, {
        points: getNearbyCollectionPoints(
          latitude,
          longitude,
          radiusMeters,
          material,
          limit,
        ),
        requestId,
      });
      return;
    }

    if (pathname === `${env.apiPrefix}/routes/plan` && request.method === "POST") {
      const body = await readJsonBody(request);
      sendJsonWithRequestId(response, requestId, 200, await planRoute(body));
      return;
    }

    notFound(response, requestId);
  } catch (error) {
    if (error instanceof JsonBodyParseError) {
      badRequest(response, requestId, error.message);
      return;
    }

    if (error instanceof HttpError) {
      sendJsonWithRequestId(response, requestId, error.statusCode, {
        error: error.code ?? "HTTP_ERROR",
        message: error.message,
        details: error.details ?? null,
        requestId,
      });
      return;
    }

    const message =
      error instanceof Error ? error.message : "Erro inesperado no backend.";

    logError("request_failed", {
      requestId,
      method: request.method,
      path: pathname,
      auth,
      durationMs: Date.now() - startedAt,
      error,
    });

    sendJsonWithRequestId(response, requestId, 500, {
      error: "Internal Server Error",
      message,
      requestId,
    });
    return;
  } finally {
    logInfo("request_completed", {
      requestId,
      method: request.method,
      path: pathname,
      auth,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    });
  }
});

await initDatabase();

server.listen(env.port, env.host, () => {
  logInfo("server_started", {
    host: env.host,
    port: env.port,
  });
});
