/*
 * Serializes command-layer operations: each open() starts a new session
 * nonce, and any async action must both belong to the current session and
 * win the busy flag before running. Stale completions from a previous
 * session (or a closed layer) are dropped instead of mutating panels.
 */
export class CommandSessionGate {
  #nonce = 0;
  #busy = false;

  get current(): number {
    return this.#nonce;
  }

  get busy(): boolean {
    return this.#busy;
  }

  open(): number {
    this.#nonce += 1;
    this.#busy = false;
    return this.#nonce;
  }

  invalidate(): void {
    this.#nonce += 1;
    this.#busy = false;
  }

  isCurrent(session: number): boolean {
    return session === this.#nonce;
  }

  start(session: number): boolean {
    if (!this.isCurrent(session) || this.#busy) return false;
    this.#busy = true;
    return true;
  }

  finish(session: number): boolean {
    if (!this.isCurrent(session)) return false;
    this.#busy = false;
    return true;
  }
}
