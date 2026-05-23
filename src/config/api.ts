const env = (
  globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }
).process?.env;

const apiBaseUrl = env?.EXPO_PUBLIC_API_BASE_URL?.trim() ?? "";

export const apiConfig = {
  apiBaseUrl,
  hasBackend: apiBaseUrl.length > 0,
};

export function buildApiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}
