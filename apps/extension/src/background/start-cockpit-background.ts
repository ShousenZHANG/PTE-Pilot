import { GatewayHttpClient } from "./gateway-http-client";
import {
  createGatewayTokenStore,
  restrictLocalStorageToTrustedContexts,
  type TrustedLocalStorage,
} from "./gateway-token-store";
import { OutboxSynchronizer } from "./outbox-synchronizer";
import {
  createRuntimeMessageHandler,
  type RuntimeSender,
} from "./runtime-handler";
import { createPtePilotDb } from "./storage/db";
import { CockpitRepositories } from "./storage/repositories";

type RuntimeListener = (
  message: unknown,
  sender: RuntimeSender,
) => Promise<unknown>;

export interface BackgroundBrowserApi {
  runtime: {
    id: string;
    onMessage: {
      addListener(listener: RuntimeListener): void;
      removeListener(listener: RuntimeListener): void;
    };
  };
  storage: { local: TrustedLocalStorage };
}

export interface StartCockpitBackgroundOptions {
  databaseName?: string;
  fetchImpl?: typeof fetch;
  clock?: () => number;
}

export async function startCockpitBackground(
  browserApi: BackgroundBrowserApi,
  options: StartCockpitBackgroundOptions = {},
): Promise<() => void> {
  await restrictLocalStorageToTrustedContexts(browserApi.storage.local);
  const clock = options.clock ?? Date.now;
  const database = createPtePilotDb(options.databaseName);
  const repository = new CockpitRepositories(database, clock);
  const tokens = createGatewayTokenStore(browserApi.storage.local);
  const gateway = new GatewayHttpClient(tokens, options.fetchImpl, 4_000);
  const synchronizer = new OutboxSynchronizer(repository, gateway, clock);
  const handler = createRuntimeMessageHandler({
    extensionId: browserApi.runtime.id,
    repository,
    gateway,
    synchronizer,
  });
  const listener: RuntimeListener = (message, sender) =>
    handler(message, sender);
  browserApi.runtime.onMessage.addListener(listener);
  if (await tokens.read()) {
    void gateway
      .health()
      .then(async (health) => {
        await repository.requeueAllAttemptsForProjection(
          health.projectionInstanceId,
        );
        synchronizer.schedule();
      })
      .catch(() => {
        // Gateway/Hermes availability never blocks local practice startup.
      });
  }

  return () => {
    browserApi.runtime.onMessage.removeListener(listener);
    database.close();
  };
}
