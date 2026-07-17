import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import {
  type BackgroundBrowserApi,
  startCockpitBackground,
} from "../src/background/start-cockpit-background";

export default defineBackground(() => {
  void startCockpitBackground(browser as unknown as BackgroundBrowserApi).catch(
    () => {
      // Fail closed: content UI reports unavailable local storage.
    },
  );
});
