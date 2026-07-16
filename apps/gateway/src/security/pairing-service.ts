import { createHmac } from "node:crypto";
import type Database from "better-sqlite3";

const PAIRING_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export class PairingError extends Error {}

type PairingServiceOptions = {
  database: Database.Database;
  now: () => Date;
  pepper: string;
  randomBytes: (size: number) => Buffer;
  ttlMs: number;
};

export class PairingService {
  constructor(private readonly options: PairingServiceOptions) {}

  createCode(): string {
    this.options.database
      .prepare(
        "DELETE FROM pairing_codes WHERE expires_at <= ? OR consumed_at IS NOT NULL",
      )
      .run(this.options.now().toISOString());

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const bytes = this.options.randomBytes(12);
      const code = [...bytes]
        .map((value) => PAIRING_ALPHABET[value % PAIRING_ALPHABET.length])
        .join("");
      const result = this.options.database
        .prepare(
          `INSERT OR IGNORE INTO pairing_codes(
            code_hash, expires_at, consumed_at
          ) VALUES (?, ?, NULL)`,
        )
        .run(
          this.hash("code", code),
          new Date(
            this.options.now().getTime() + this.options.ttlMs,
          ).toISOString(),
        );
      if (result.changes === 1) return code;
    }
    throw new PairingError("could not create a unique pairing code");
  }

  pair(code: string): string {
    const codeHash = this.hash("code", code.toUpperCase());
    return this.options.database
      .transaction(() => {
        const row = this.options.database
          .prepare(
            `SELECT expires_at AS expiresAt, consumed_at AS consumedAt
           FROM pairing_codes WHERE code_hash = ?`,
          )
          .get(codeHash) as
          | { consumedAt: string | null; expiresAt: string }
          | undefined;
        if (!row || row.consumedAt !== null) {
          throw new PairingError("pairing code invalid or already consumed");
        }
        const now = this.options.now();
        if (new Date(row.expiresAt).getTime() <= now.getTime()) {
          throw new PairingError("pairing code expired");
        }

        const consumed = this.options.database
          .prepare(
            `UPDATE pairing_codes SET consumed_at = ?
           WHERE code_hash = ? AND consumed_at IS NULL`,
          )
          .run(now.toISOString(), codeHash);
        if (consumed.changes !== 1) {
          throw new PairingError("pairing code invalid or already consumed");
        }

        const token = this.options.randomBytes(32).toString("base64url");
        this.options.database
          .prepare(
            `INSERT INTO bearer_tokens(token_hash, created_at, revoked_at)
           VALUES (?, ?, NULL)`,
          )
          .run(this.hash("token", token), now.toISOString());
        return token;
      })
      .immediate();
  }

  isTokenActive(token: string): boolean {
    const row = this.options.database
      .prepare(
        `SELECT 1 AS active FROM bearer_tokens
         WHERE token_hash = ? AND revoked_at IS NULL`,
      )
      .get(this.hash("token", token)) as { active: 1 } | undefined;
    return row?.active === 1;
  }

  private hash(namespace: "code" | "token", value: string): string {
    return createHmac("sha256", this.options.pepper)
      .update(`${namespace}\0${value}`)
      .digest("hex");
  }
}
