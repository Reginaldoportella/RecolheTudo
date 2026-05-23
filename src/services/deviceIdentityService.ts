import AsyncStorage from "@react-native-async-storage/async-storage";

const DEVICE_ID_KEY = "recolhetudo.device_id";

let cachedDeviceIdPromise: Promise<string> | null = null;

function createDeviceId(): string {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `device_${random}`;
}

export const deviceIdentityService = {
  async getDeviceId(): Promise<string> {
    if (!cachedDeviceIdPromise) {
      cachedDeviceIdPromise = (async () => {
        const existing = await AsyncStorage.getItem(DEVICE_ID_KEY);

        if (existing) {
          return existing;
        }

        const nextDeviceId = createDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, nextDeviceId);
        return nextDeviceId;
      })();
    }

    return cachedDeviceIdPromise;
  },
};
