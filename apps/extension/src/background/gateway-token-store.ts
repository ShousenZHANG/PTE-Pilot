export const GATEWAY_TOKEN_STORAGE_KEY = "ptePilot.gatewayToken";

export interface TrustedLocalStorage {
  get(key: string): Promise<Record<string, unknown>>;
  set(values: Record<string, unknown>): Promise<void>;
  remove(key: string): Promise<void>;
  setAccessLevel(options: { accessLevel: "TRUSTED_CONTEXTS" }): Promise<void>;
}

export interface GatewayTokenStore {
  read(): Promise<string | null>;
  write(token: string): Promise<void>;
  clear(): Promise<void>;
}

export async function restrictLocalStorageToTrustedContexts(
  storage: TrustedLocalStorage,
): Promise<void> {
  await storage.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
}

export function createGatewayTokenStore(
  storage: TrustedLocalStorage,
): GatewayTokenStore {
  return {
    async read() {
      const value = (await storage.get(GATEWAY_TOKEN_STORAGE_KEY))[
        GATEWAY_TOKEN_STORAGE_KEY
      ];
      return typeof value === "string" && value.length >= 32 ? value : null;
    },
    async write(token) {
      if (token.length < 32) throw new Error("Gateway token is invalid");
      await storage.set({ [GATEWAY_TOKEN_STORAGE_KEY]: token });
    },
    async clear() {
      await storage.remove(GATEWAY_TOKEN_STORAGE_KEY);
    },
  };
}
