import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";
import {
  type AudioCaptureBrowserApi,
  startAudioCaptureBackground,
} from "../src/background/audio-capture";
import {
  type BackgroundBrowserApi,
  startCockpitBackground,
} from "../src/background/start-cockpit-background";

export default defineBackground(() => {
  startAudioCaptureBackground(browser as unknown as AudioCaptureBrowserApi);
  void startCockpitBackground(browser as unknown as BackgroundBrowserApi).catch(
    () => {
      // Fail closed: content UI reports unavailable storage/Gateway capabilities.
    },
  );
});
