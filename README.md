# PTE Pilot

Keyboard-first Chrome MV3 assistant for Firefly WFD weekly-prediction practice. Firefly remains the authenticated source of question identity, original audio, answer reveal, and navigation. PTE Pilot adds a full-screen Shadow DOM cockpit, deterministic word-level review, local wrong-word memory, durable drafts, and optional bounded Hermes ranking/memory through a private loopback Gateway.

## Build

Prerequisites: Node.js `>=24.14 <25`, pnpm `>=11.7 <12`, and Chrome/Chromium. The lockfile was generated with pnpm `11.7.0`.

```powershell
pnpm install --frozen-lockfile
pnpm verify
```

Load `apps/extension/.output/chrome-mv3` as an unpacked extension at `chrome://extensions`. Open the Firefly weekly-prediction exercise page, then press `Alt+Shift+P` to open or close the cockpit.

The extension requests only `storage`, `webRequest`, the Firefly page/media origins, and `127.0.0.1:8642`. It has no cookie, download, debugger, tab, or all-sites permission. It does not persist audio, drafts outside IndexedDB, or complete correct sentences.

## Core keys

| State | Key | Action |
| --- | --- | --- |
| Any page state | `Alt+Shift+P` | Toggle cockpit |
| Answering | `Enter` | Submit once |
| Answering | `Alt+P` / `Alt+R` | Play-pause / restart original audio |
| Answering | `Alt+J` / `Alt+K` | Next / previous question |
| Answering | `Alt+M` | Mark question |
| Answering | `Esc` | Command layer |
| Review | `Enter` or `J` / `K` | Next / previous after key-release guard |
| Review | `Space` / `R` / `T` | Play / restart / redo |
| Command | `E` / `Q` / `W` / `S` / `B` | Mode / ranked review / word library / settings / build full index |
| Indexing | `Esc` / `Enter` or `R` / `X` | Pause / resume / cancel and restore origin |

Typing stays in an uncontrolled native textarea. The Firefly input receives one native write only at verified submission.

## Optional Gateway and Hermes

Local practice works without either service. For durable event projection and Hermes memory/ranking:

1. Build the Gateway: `pnpm --filter @pte-pilot/gateway build`.
2. Copy `apps/gateway/.env.example` outside the repository and fill its secrets plus the unpacked extension ID.
3. Run `node.exe --env-file="C:\path\to\gateway.env" .\apps\gateway\dist\main.js`.
4. Create a short-lived code with `node.exe --env-file="C:\path\to\gateway.env" .\apps\gateway\dist\cli\create-pairing-code.js` and enter it in cockpit Settings.

Hermes is optional and must use a separate private profile on `127.0.0.1:8643`. Examples live in `apps/gateway/hermes`. The Gateway refuses Hermes if the advertised model is not exactly `pte-pilot`, if any capability beyond `memory` is enabled, or if MCP is not disabled. Hermes can rank only a locally generated candidate set; it never controls the browser, audio, submission, answer reveal, or navigation.

## Safety boundary

- No login, paywall, CAPTCHA, or rate-limit bypass.
- No bulk question traversal when the site reports authentication, access, or structure failure.
- No audio download library or answer-corpus export.
- Correct answers are read only after a verified scoring/reveal transition and are reduced immediately to word-level error facts.
- Every navigation, submission, answer reveal, and media observation is tied to the current question and monotonic epoch; ambiguous site state fails closed.
