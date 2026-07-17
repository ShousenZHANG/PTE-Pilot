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
}

export interface StartCockpitBackgroundOptions {
  databaseName?: string;
  clock?: () => number;
}

export async function startCockpitBackground(
  browserApi: BackgroundBrowserApi,
  options: StartCockpitBackgroundOptions = {},
): Promise<() => void> {
  const clock = options.clock ?? Date.now;
  const database = createPtePilotDb(options.databaseName);
  const repository = new CockpitRepositories(database, clock);
  const handler = createRuntimeMessageHandler({
    extensionId: browserApi.runtime.id,
    repository,
  });
  const listener: RuntimeListener = (message, sender) =>
    handler(message, sender);
  browserApi.runtime.onMessage.addListener(listener);

  return () => {
    browserApi.runtime.onMessage.removeListener(listener);
    database.close();
  };
}
