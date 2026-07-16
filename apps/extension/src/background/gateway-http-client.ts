import {
  type BatchUpsertRequest,
  type BatchUpsertResponse,
  BatchUpsertResponseSchema,
  type GatewayHealth,
  GatewayHealthSchema,
  PairRequestSchema,
  PairResponseSchema,
  type RankRequest,
  type RankResponse,
  RankResponseSchema,
} from "@pte-pilot/contracts";
import type { GatewayTokenStore } from "./gateway-token-store";

export const GATEWAY_BASE_URL = "http://127.0.0.1:8642";

export type GatewayFailureReason =
  | "offline"
  | "timeout"
  | "unauthorized"
  | "invalid-response";

export class GatewayHttpError extends Error {
  constructor(
    readonly reason: GatewayFailureReason,
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
    this.name = "GatewayHttpError";
  }
}

interface ResponseSchema<T> {
  parse(input: unknown): T;
}

interface RequestOptions<T> {
  method?: "GET" | "POST";
  body?: unknown;
  authenticated?: boolean;
  idempotencyKey?: string;
  schema: ResponseSchema<T>;
  signal: AbortSignal | undefined;
}

export interface PtePilotGatewayClient {
  pair(pairingCode: string, signal?: AbortSignal): Promise<GatewayHealth>;
  health(signal?: AbortSignal): Promise<GatewayHealth>;
  upsertEvents(
    request: BatchUpsertRequest,
    signal?: AbortSignal,
  ): Promise<BatchUpsertResponse>;
  rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse>;
}

export class GatewayHttpClient implements PtePilotGatewayClient {
  constructor(
    private readonly tokens: GatewayTokenStore,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = 4_000,
  ) {}

  async pair(
    pairingCode: string,
    signal?: AbortSignal,
  ): Promise<GatewayHealth> {
    const request = PairRequestSchema.parse({ pairingCode });
    const response = await this.request("/pte/v1/pair", {
      body: request,
      method: "POST",
      schema: PairResponseSchema,
      signal,
    });
    await this.tokens.write(response.token);
    try {
      return await this.health(signal);
    } catch (error) {
      await this.tokens.clear();
      throw error;
    }
  }

  health(signal?: AbortSignal): Promise<GatewayHealth> {
    return this.request("/pte/v1/health", {
      schema: GatewayHealthSchema,
      signal,
    });
  }

  upsertEvents(
    request: BatchUpsertRequest,
    signal?: AbortSignal,
  ): Promise<BatchUpsertResponse> {
    return this.request("/pte/v1/events:batchUpsert", {
      authenticated: true,
      body: request,
      idempotencyKey: request.batchId,
      method: "POST",
      schema: BatchUpsertResponseSchema,
      signal,
    });
  }

  rank(request: RankRequest, signal?: AbortSignal): Promise<RankResponse> {
    return this.request("/pte/v1/rank", {
      authenticated: true,
      body: request,
      method: "POST",
      schema: RankResponseSchema,
      signal,
    });
  }

  private async request<T>(
    path: string,
    options: RequestOptions<T>,
  ): Promise<T> {
    const controller = new AbortController();
    const abortFromParent = () => controller.abort(options.signal?.reason);
    if (options.signal?.aborted) abortFromParent();
    else
      options.signal?.addEventListener("abort", abortFromParent, {
        once: true,
      });
    const timeout = setTimeout(
      () =>
        controller.abort(new DOMException("Gateway timeout", "TimeoutError")),
      this.timeoutMs,
    );

    try {
      const headers = new Headers({ Accept: "application/json" });
      if (options.body !== undefined)
        headers.set("Content-Type", "application/json");
      if (options.idempotencyKey) {
        headers.set("Idempotency-Key", options.idempotencyKey);
      }
      if (options.authenticated) {
        const token = await this.tokens.read();
        if (!token) {
          throw new GatewayHttpError(
            "unauthorized",
            "PTE Pilot Gateway is not paired",
          );
        }
        headers.set("Authorization", `Bearer ${token}`);
      }

      const init: RequestInit = {
        cache: "no-store",
        credentials: "omit",
        headers,
        method: options.method ?? "GET",
        redirect: "error",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      };
      if (options.body !== undefined) init.body = JSON.stringify(options.body);
      const response = await this.fetchImpl(`${GATEWAY_BASE_URL}${path}`, init);
      if (!response.ok) {
        throw new GatewayHttpError(
          response.status === 401 || response.status === 403
            ? "unauthorized"
            : "invalid-response",
          `Gateway returned HTTP ${response.status}`,
          response.status,
        );
      }
      const payload: unknown = await response.json();
      try {
        return options.schema.parse(payload);
      } catch {
        throw new GatewayHttpError(
          "invalid-response",
          "Gateway returned an invalid response",
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof GatewayHttpError) throw error;
      if (controller.signal.aborted) {
        throw new GatewayHttpError("timeout", "Gateway request timed out");
      }
      throw new GatewayHttpError("offline", "Gateway is offline");
    } finally {
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abortFromParent);
    }
  }
}
