import { describe, expect, test, vi } from "vitest";
import {
  createGatewayTokenStore,
  GATEWAY_TOKEN_STORAGE_KEY,
  restrictLocalStorageToTrustedContexts,
  type TrustedLocalStorage,
} from "./gateway-token-store";

describe("Gateway token storage", () => {
  test("restricts storage before keeping token", async () => {
    const facts: Record<string, unknown> = {};
    const setAccessLevel = vi.fn(async () => undefined);
    const storage: TrustedLocalStorage = {
      get: async () => facts,
      set: async (values) => {
        Object.assign(facts, values);
      },
      remove: async (key) => {
        delete facts[key];
      },
      setAccessLevel,
    };
    await restrictLocalStorageToTrustedContexts(storage);
    const tokens = createGatewayTokenStore(storage);
    await tokens.write("s".repeat(43));
    expect(setAccessLevel).toHaveBeenCalledWith({
      accessLevel: "TRUSTED_CONTEXTS",
    });
    expect(facts[GATEWAY_TOKEN_STORAGE_KEY]).toBe("s".repeat(43));
  });
});
