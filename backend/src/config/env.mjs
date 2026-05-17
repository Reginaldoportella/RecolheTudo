import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, "../../..");
const backendRoot = path.resolve(__dirname, "../..");

function stripWrappingQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function loadEnvFile(envFilePath) {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const contents = fs.readFileSync(envFilePath, "utf8");
  const lines = contents.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = stripWrappingQuotes(line.slice(separatorIndex + 1).trim());

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.join(workspaceRoot, ".env"));
loadEnvFile(path.join(backendRoot, ".env"));

function requiredConfig(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }

  return value;
}

function optionalConfig(name, fallback) {
  return process.env[name]?.trim() || fallback;
}

function buildDatabaseUrl() {
  const explicitUrl = process.env.DATABASE_URL?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  const username = encodeURIComponent(requiredConfig("POSTGRES_USER"));
  const password = encodeURIComponent(requiredConfig("POSTGRES_PASSWORD"));
  const host = optionalConfig("POSTGRES_HOST", "localhost");
  const port = optionalConfig("POSTGRES_PORT", "5432");
  const database = encodeURIComponent(requiredConfig("POSTGRES_DB"));

  return `postgresql://${username}:${password}@${host}:${port}/${database}`;
}

const env = {
  host: optionalConfig("HOST", "0.0.0.0"),
  port: Number(optionalConfig("PORT", "3001")),
  apiPrefix: "/v1",
  useOsrm: optionalConfig("USE_OSRM", "true") !== "false",
  databaseUrl: buildDatabaseUrl(),
};

export default env;
