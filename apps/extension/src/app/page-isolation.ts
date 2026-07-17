interface SavedIsolation {
  element: HTMLElement;
  inert: boolean;
  ariaHidden: string | null;
  isolationMarker: string | null;
}

export const PTE_PILOT_ISOLATION_ATTRIBUTE = "data-pte-pilot-isolated";
export const PTE_PILOT_COCKPIT_OPEN_ATTRIBUTE = "data-pte-pilot-cockpit-open";

const SUPPRESSION_STYLE_ID = "pte-pilot-site-overlay-suppression";

/*
 * While the cockpit covers the page, Firefly's AI score dialog must never
 * paint above it. Forcing z-index keeps the dialog technically visible
 * (display/opacity untouched), so the adapter can still read and prove the
 * revealed answer while the user only ever sees the cockpit.
 */
const SUPPRESSION_CSS = `
html[${PTE_PILOT_COCKPIT_OPEN_ATTRIBUTE}] .el-dialog__wrapper.ai-score,
html[${PTE_PILOT_COCKPIT_OPEN_ATTRIBUTE}] .v-modal {
  z-index: 0 !important;
}
`;

function ensureSuppressionStyle(): void {
  if (document.getElementById(SUPPRESSION_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = SUPPRESSION_STYLE_ID;
  style.textContent = SUPPRESSION_CSS;
  document.head.append(style);
}

export class PageIsolation {
  #saved: SavedIsolation[] = [];
  #savedByElement = new Map<HTMLElement, SavedIsolation>();
  #previousFocus: HTMLElement | null = null;
  #observer: MutationObserver | null = null;
  #enabled = false;

  enable(cockpitNode: HTMLElement): void {
    if (this.#enabled) return;
    this.#enabled = true;
    ensureSuppressionStyle();
    document.documentElement.setAttribute(PTE_PILOT_COCKPIT_OPEN_ATTRIBUTE, "");
    this.#previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const host =
      cockpitNode.getRootNode() instanceof ShadowRoot
        ? (cockpitNode.getRootNode() as ShadowRoot).host
        : cockpitNode;
    for (const child of Array.from(document.body.children)) {
      if (child instanceof HTMLElement) this.isolate(child, host);
    }
    this.#observer = new MutationObserver((mutations) => {
      if (!this.#enabled) return;
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          mutation.target instanceof HTMLElement &&
          mutation.target.parentElement === document.body
        ) {
          this.isolate(mutation.target, host);
        }
        for (const node of mutation.addedNodes) {
          if (
            node instanceof HTMLElement &&
            node.parentElement === document.body
          ) {
            this.isolate(node, host);
          }
        }
      }
    });
    this.#observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["inert", "aria-hidden", PTE_PILOT_ISOLATION_ATTRIBUTE],
    });
  }

  disable(): void {
    if (!this.#enabled) return;
    this.#enabled = false;
    document.documentElement.removeAttribute(PTE_PILOT_COCKPIT_OPEN_ATTRIBUTE);
    this.#observer?.disconnect();
    this.#observer = null;
    for (const saved of this.#saved) {
      saved.element.inert = saved.inert;
      if (saved.ariaHidden === null)
        saved.element.removeAttribute("aria-hidden");
      else saved.element.setAttribute("aria-hidden", saved.ariaHidden);
      if (saved.isolationMarker === null)
        saved.element.removeAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE);
      else
        saved.element.setAttribute(
          PTE_PILOT_ISOLATION_ATTRIBUTE,
          saved.isolationMarker,
        );
    }
    this.#saved = [];
    this.#savedByElement.clear();
    this.#previousFocus?.focus({ preventScroll: true });
    this.#previousFocus = null;
  }

  private isolate(element: HTMLElement, host: Element): void {
    if (element === host || element.contains(host)) {
      return;
    }
    let saved = this.#savedByElement.get(element);
    if (!saved) {
      saved = {
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
        isolationMarker: element.getAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE),
      };
      this.#savedByElement.set(element, saved);
      this.#saved.push(saved);
    }
    if (!element.inert) element.inert = true;
    if (element.getAttribute("aria-hidden") !== "true") {
      element.setAttribute("aria-hidden", "true");
    }
    if (saved.ariaHidden !== "true") {
      if (
        element.getAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE) !== "aria-added"
      ) {
        element.setAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE, "aria-added");
      }
    } else if (saved.isolationMarker === null) {
      element.removeAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE);
    } else if (
      element.getAttribute(PTE_PILOT_ISOLATION_ATTRIBUTE) !==
      saved.isolationMarker
    ) {
      element.setAttribute(
        PTE_PILOT_ISOLATION_ATTRIBUTE,
        saved.isolationMarker,
      );
    }
  }
}

export function trapTab(event: KeyboardEvent, root: HTMLElement): void {
  if (event.key !== "Tab") return;
  const focusable = Array.from(
    root.querySelectorAll<HTMLElement>(
      "button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
    ),
  ).filter(
    (element) =>
      !element.hidden && element.getAttribute("aria-hidden") !== "true",
  );
  if (focusable.length === 0) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (!first || !last) return;
  const nodeRoot = root.getRootNode();
  const activeElement =
    nodeRoot instanceof ShadowRoot
      ? nodeRoot.activeElement
      : document.activeElement;
  if (event.shiftKey && activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}
