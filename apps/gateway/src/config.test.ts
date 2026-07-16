import { describe, expect, it } from "vitest";
import { loadGatewayConfig } from "./config.js";

const base = {
  PTE_GATEWAY_ALLOWED_ORIGIN:
    "chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  PTE_GATEWAY_DB_PATH: ":memory:",
  PTE_GATEWAY_TOKEN_PEPPER: "a-secure-test-pepper-with-32-characters",
};

describe("loadGatewayConfig", () => {
  it("uses fixed loopback defaults and permits local-only mode", () => {
    expect(loadGatewayConfig(base)).toMatchObject({
      hermesEnabled: false,
      host: "127.0.0.1",
      port: 8642,
    });
  });

  it("rejects public Gateway and Hermes hosts", () => {
    expect(() =>
      loadGatewayConfig({ ...base, PTE_GATEWAY_HOST: "0.0.0.0" }),
    ).toThrow();
    expect(() =>
      loadGatewayConfig({
        ...base,
        HERMES_API_KEY: "a-secure-test-key-with-at-least-32-characters",
        HERMES_BASE_URL: "http://0.0.0.0:8643",
        HERMES_CONFIG_PATH: "C:\\hermes\\config.yaml",
      }),
    ).toThrow("Hermes must use 127.0.0.1");
  });

  it("rejects partial Hermes credentials", () => {
    expect(() =>
      loadGatewayConfig({
        ...base,
        HERMES_BASE_URL: "http://127.0.0.1:8643",
      }),
    ).toThrow("must be configured together");
  });
});
