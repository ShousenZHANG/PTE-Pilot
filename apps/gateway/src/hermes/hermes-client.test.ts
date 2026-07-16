import { describe, expect, it, vi } from "vitest";
import {
  createHttpHermesClient,
  parseHermesApiToolPolicy,
} from "./hermes-client.js";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

const models = { data: [{ id: "pte-pilot" }], object: "list" };
const memoryToolsets = {
  data: [
    {
      configured: true,
      description: "Long-term memory",
      enabled: true,
      label: "Memory",
      name: "memory",
      tools: ["memory_store", "memory_recall"],
    },
  ],
  object: "list",
  platform: "api_server",
};

function clientWith(
  fetchImplementation: typeof fetch,
  policy: readonly string[] = ["memory", "no_mcp"],
) {
  return createHttpHermesClient({
    apiKey: "test-hermes-key-with-at-least-thirty-two-characters",
    baseUrl: "http://127.0.0.1:8643",
    configPath: ":test:",
    expectedModel: "pte-pilot",
    fetchImplementation,
    readToolPolicy: async () => policy,
    timeoutMs: 1_500,
  });
}

describe("Hermes runtime audit", () => {
  it("accepts real envelope with sole enabled memory toolset", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(models))
      .mockResolvedValueOnce(jsonResponse(memoryToolsets));
    await expect(clientWith(fetchImplementation).audit()).resolves.toEqual({
      enabledTools: ["memory"],
      model: "pte-pilot",
      status: "ready",
      unexpectedTools: [],
    });
  });

  it("rejects every extra enabled capability", async () => {
    const fetchImplementation = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(models))
      .mockResolvedValueOnce(
        jsonResponse({
          ...memoryToolsets,
          data: [
            ...memoryToolsets.data,
            {
              configured: true,
              enabled: true,
              name: "terminal",
              tools: ["terminal", "process"],
            },
          ],
        }),
      );
    await expect(
      clientWith(fetchImplementation).audit(),
    ).resolves.toMatchObject({
      enabledTools: ["memory", "terminal"],
      status: "rejected",
      unexpectedTools: ["terminal"],
    });
  });

  it.each(["terminal", "browser"])(
    "rejects an injected %s child tool inside the memory toolset",
    async (injectedTool) => {
      const memoryToolset = memoryToolsets.data[0];
      if (!memoryToolset) throw new Error("memory toolset fixture missing");
      const fetchImplementation = vi
        .fn()
        .mockResolvedValueOnce(jsonResponse(models))
        .mockResolvedValueOnce(
          jsonResponse({
            ...memoryToolsets,
            data: [
              {
                ...memoryToolset,
                tools: [...memoryToolset.tools, injectedTool],
              },
            ],
          }),
        );

      await expect(
        clientWith(fetchImplementation).audit(),
      ).resolves.toMatchObject({
        enabledTools: ["memory"],
        status: "rejected",
        unexpectedTools: [injectedTool],
      });
    },
  );

  it("rejects wrong model and missing no_mcp config sentinel", async () => {
    const wrongModelFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "other" }] }))
      .mockResolvedValueOnce(jsonResponse(memoryToolsets));
    await expect(clientWith(wrongModelFetch).audit()).resolves.toMatchObject({
      model: "other",
      status: "rejected",
    });

    const missingSentinelFetch = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(models))
      .mockResolvedValueOnce(jsonResponse(memoryToolsets));
    await expect(
      clientWith(missingSentinelFetch, ["memory"]).audit(),
    ).resolves.toMatchObject({
      status: "rejected",
      unexpectedTools: ["mcp-policy"],
    });
  });

  it("reports transport failure as offline", async () => {
    const fetchImplementation = vi.fn().mockRejectedValue(new Error("offline"));
    await expect(
      clientWith(fetchImplementation).audit(),
    ).resolves.toMatchObject({
      status: "offline",
    });
  });
});

describe("parseHermesApiToolPolicy", () => {
  it("parses block and inline exact policies", () => {
    expect(
      parseHermesApiToolPolicy(
        "platform_toolsets:\n  api_server:\n    - memory\n    - no_mcp\n",
      ),
    ).toEqual(["memory", "no_mcp"]);
    expect(
      parseHermesApiToolPolicy(
        "platform_toolsets:\n  api_server: [memory, no_mcp]\n",
      ),
    ).toEqual(["memory", "no_mcp"]);
  });

  it("rejects duplicate policy roots", () => {
    expect(() =>
      parseHermesApiToolPolicy(
        "platform_toolsets:\n  api_server: [memory]\nplatform_toolsets:\n  api_server: [memory]\n",
      ),
    ).toThrow("exactly once");
  });
});
