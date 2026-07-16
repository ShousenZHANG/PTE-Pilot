import { readFile } from "node:fs/promises";
import type { RankRequest } from "@pte-pilot/contracts";
import { z } from "zod";

export type HermesRuntimeAudit = {
  enabledTools: string[];
  model: string | null;
  status: "ready" | "offline" | "rejected";
  unexpectedTools: string[];
};

export type CompactLearningProfile = {
  meanAccuracy: number;
  meanReplayCount: number;
  projectionVersion: number;
  topErrorTypes: Array<{ count: number; type: string }>;
  totalAttempts: number;
  weakWords: Array<{ count: number; word: string }>;
};

export interface HermesClient {
  audit(): Promise<HermesRuntimeAudit>;
  rank(request: RankRequest): Promise<unknown>;
  syncMemory(profile: CompactLearningProfile): Promise<void>;
}

type HttpHermesClientOptions = {
  apiKey: string;
  baseUrl: string;
  configPath: string;
  expectedModel: "pte-pilot";
  fetchImplementation?: typeof fetch;
  readToolPolicy?: () => Promise<readonly string[]>;
  timeoutMs: number;
};

const ModelsSchema = z.object({
  data: z.array(z.object({ id: z.string() })),
});

const ToolsetsSchema = z.object({
  data: z.array(
    z.object({
      configured: z.boolean(),
      description: z.string().optional(),
      enabled: z.boolean(),
      label: z.string().optional(),
      name: z.string(),
      tools: z.array(z.string()),
    }),
  ),
  object: z.literal("list"),
  platform: z.literal("api_server"),
});

const ALLOWED_MEMORY_CHILD_TOOLS = new Set(["memory_store", "memory_recall"]);

const ResponsesSchema = z.object({
  output: z.array(
    z
      .object({
        content: z
          .array(z.object({ type: z.string(), text: z.string().optional() }))
          .optional(),
        type: z.string(),
      })
      .passthrough(),
  ),
});

function extractOutputText(value: unknown): string {
  const response = ResponsesSchema.parse(value);
  const parts = response.output
    .flatMap((item) => item.content ?? [])
    .filter(
      (part): part is { type: string; text: string } =>
        part.type === "output_text" && typeof part.text === "string",
    )
    .map(({ text }) => text);
  if (parts.length !== 1) {
    throw new Error("Hermes returned an ambiguous text response");
  }
  return parts[0] ?? "";
}

export function parseHermesApiToolPolicy(source: string): string[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const rootIndexes = lines.flatMap((line, index) =>
    /^platform_toolsets:\s*$/.test(line) ? [index] : [],
  );
  if (rootIndexes.length !== 1) {
    throw new Error("Hermes platform_toolsets must appear exactly once");
  }

  const rootIndex = rootIndexes[0] ?? -1;
  let rootEnd = rootIndex + 1;
  while (
    rootEnd < lines.length &&
    (lines[rootEnd]?.trim() === "" || /^\s/.test(lines[rootEnd] ?? ""))
  ) {
    rootEnd += 1;
  }
  const block = lines.slice(rootIndex + 1, rootEnd);
  const apiIndexes = block.flatMap((line, index) =>
    /^ {2}api_server:\s*(?:\[[^\]]*\])?\s*$/.test(line) ? [index] : [],
  );
  if (apiIndexes.length !== 1) {
    throw new Error("Hermes api_server tool policy must appear exactly once");
  }

  const apiIndex = apiIndexes[0] ?? -1;
  const declaration = block[apiIndex] ?? "";
  const inline = /^ {2}api_server:\s*\[([^\]]*)\]\s*$/.exec(declaration);
  if (inline) {
    return (inline[1] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  const values: string[] = [];
  for (const line of block.slice(apiIndex + 1)) {
    if (line.trim() === "") continue;
    const item = /^ {4}- ([a-z0-9_-]+)\s*$/.exec(line);
    if (item) {
      values.push(item[1] ?? "");
      continue;
    }
    if (/^ {2}\S/.test(line)) break;
    throw new Error("Hermes api_server policy uses an unsupported YAML shape");
  }
  return values;
}

export async function readHermesApiToolPolicy(
  configPath: string,
): Promise<string[]> {
  return parseHermesApiToolPolicy(await readFile(configPath, "utf8"));
}

export function createOfflineHermesClient(): HermesClient {
  return {
    audit: async () => ({
      enabledTools: [],
      model: null,
      status: "offline",
      unexpectedTools: [],
    }),
    rank: async () => {
      throw new Error("Hermes is not configured");
    },
    syncMemory: async () => {
      throw new Error("Hermes is not configured");
    },
  };
}

export function createHttpHermesClient(
  options: HttpHermesClientOptions,
): HermesClient {
  const request = options.fetchImplementation ?? fetch;
  const headers = {
    Authorization: `Bearer ${options.apiKey}`,
    "Content-Type": "application/json",
    "X-Hermes-Session-Key": "pte-pilot:local:v1",
  };

  const getJson = async (path: string): Promise<unknown> => {
    const response = await request(`${options.baseUrl}${path}`, {
      headers,
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok)
      throw new Error(`Hermes ${path} failed with ${response.status}`);
    return response.json();
  };

  const postResponse = async (
    instructions: string,
    input: unknown,
  ): Promise<unknown> => {
    const response = await request(`${options.baseUrl}/v1/responses`, {
      body: JSON.stringify({
        input: JSON.stringify(input),
        instructions,
        model: options.expectedModel,
        store: false,
      }),
      headers,
      method: "POST",
      signal: AbortSignal.timeout(options.timeoutMs),
    });
    if (!response.ok) {
      throw new Error(`Hermes response failed with ${response.status}`);
    }
    return response.json();
  };

  return {
    async audit(): Promise<HermesRuntimeAudit> {
      let configuredPolicy: readonly string[];
      try {
        configuredPolicy = await (
          options.readToolPolicy ??
          (() => readHermesApiToolPolicy(options.configPath))
        )();
      } catch {
        return {
          enabledTools: [],
          model: null,
          status: "rejected",
          unexpectedTools: ["mcp-policy"],
        };
      }

      let modelsValue: unknown;
      let toolsetsValue: unknown;
      try {
        [modelsValue, toolsetsValue] = await Promise.all([
          getJson("/v1/models"),
          getJson("/v1/toolsets"),
        ]);
      } catch {
        return {
          enabledTools: [],
          model: null,
          status: "offline",
          unexpectedTools: [],
        };
      }

      try {
        const models = ModelsSchema.parse(modelsValue);
        const toolsets = ToolsetsSchema.parse(toolsetsValue);
        const enabledEntries = toolsets.data.filter(({ enabled }) => enabled);
        const enabledTools = enabledEntries.map(({ name }) => name).sort();
        const model =
          models.data.length === 1 ? (models.data[0]?.id ?? null) : null;
        const exactPolicy =
          configuredPolicy.length === 2 &&
          configuredPolicy[0] === "memory" &&
          configuredPolicy[1] === "no_mcp";
        const memoryEntry = enabledEntries.find(
          ({ name }) => name === "memory",
        );
        const unexpectedTools = [
          ...new Set([
            ...enabledEntries
              .filter(({ name }) => name !== "memory")
              .map(({ name }) => name),
            ...(memoryEntry?.tools.filter(
              (tool) => !ALLOWED_MEMORY_CHILD_TOOLS.has(tool),
            ) ?? []),
            ...(memoryEntry?.configured === true
              ? []
              : ["memory-unconfigured"]),
            ...(exactPolicy ? [] : ["mcp-policy"]),
          ]),
        ].sort();
        const ready =
          model === options.expectedModel &&
          enabledEntries.length === 1 &&
          enabledEntries[0]?.name === "memory" &&
          memoryEntry?.configured === true &&
          unexpectedTools.length === 0;
        return {
          enabledTools,
          model,
          status: ready ? "ready" : "rejected",
          unexpectedTools,
        };
      } catch {
        return {
          enabledTools: [],
          model: null,
          status: "rejected",
          unexpectedTools: ["protocol"],
        };
      }
    },

    async rank(rankRequest: RankRequest): Promise<unknown> {
      const value = await postResponse(
        "Return exactly one JSON object echoing decisionId, candidateSetHash, and learnerStateVersion. Rank every supplied questionId exactly once. Do not call tools. Do not add prose.",
        rankRequest,
      );
      return JSON.parse(extractOutputText(value));
    },

    async syncMemory(profile: CompactLearningProfile): Promise<void> {
      const value = await postResponse(
        "Use only memory. Maintain one entry beginning PTE_PILOT_PROFILE_V1. Replace its compact aggregate profile. Never retain sentences, audio URLs, credentials, raw events, or user drafts. Return only MEMORY_SYNCED.",
        profile,
      );
      if (extractOutputText(value).trim() !== "MEMORY_SYNCED") {
        throw new Error("Hermes did not confirm bounded memory refresh");
      }
    },
  };
}
