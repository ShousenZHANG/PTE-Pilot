import { createRoot, type Root } from "react-dom/client";
import { createShadowRootUi } from "wxt/utils/content-script-ui/shadow-root";
import { defineContentScript } from "wxt/utils/define-content-script";
import { Cockpit } from "../src/app/Cockpit";
import "../src/app/cockpit.css";

export default defineContentScript({
  matches: ["https://www.fireflyau.com/ptehome/exercise*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",
  async main(ctx) {
    const url = new URL(window.location.href);
    const pageSources = url.searchParams.getAll("pageSource");
    if (
      url.pathname !== "/ptehome/exercise" ||
      pageSources.length !== 1 ||
      pageSources[0] !== "yc"
    )
      return;

    const ui = await createShadowRootUi<Root>(ctx, {
      name: "pte-pilot-cockpit",
      position: "modal",
      zIndex: 2_147_483_647,
      isolateEvents: ["keydown", "keyup", "keypress", "input", "change"],
      onMount(container, _shadow, host) {
        host.setAttribute("data-pte-pilot-host", "");
        const root = createRoot(container);
        root.render(<Cockpit />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
    ctx.onInvalidated(() => ui.remove());
  },
});
