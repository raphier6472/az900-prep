# az900-prep

Single-file study web app for the **Microsoft AZ-900 (Azure Fundamentals)** exam. Static HTML/CSS/JS,
no backend, progress kept in the browser's `localStorage` (export/import as JSON from the page).
Served by nginx on a small homelab LXC container.

Exam passed on **2026-09-13** — this repo is the archived final state (tag `az900-final`). The same
engine was forked for CompTIA Linux+ in the `linuxplus-prep` repo.

## Layout

| Path | What |
|---|---|
| `src/az900-template.html` | The app. Master source; edit this, never the built file. Fonts are `__PLEX*__` placeholders. |
| `src/fonts/` | IBM Plex Mono/Sans `.woff2` and their base64 (`.b64`) used by the build. |
| `build.py` | `src/` → `dist/index.html` (fonts inlined) + checks: no placeholder left, every `<script>` block passes `node --check`. |
| `deploy.sh` | `build.py` → `scp` to the target host → `nginx -t && reload` → md5 local/remote/live must match. |
| `tools/` | Node scripts used to shape the question bank (see below). They read/write scratch files in `work/` (git-ignored). |
| `qa/` | Browser snippets for `agent-browser eval --stdin` that answer a whole practice exam and read the results panel. |
| `legacy/` | The server-side progress backend (`az900-api.py` + unit) that was removed from the CT on 2026-08-18. Reference only. |

## Build and deploy

```bash
python3 build.py                                  # → dist/index.html
REMOTE=user@host KEY=~/.ssh/your_deploy_key ./deploy.sh   # default remote path: /var/www/html/az900/index.html
REMOTE=user@host KEY=~/.ssh/your_deploy_key REMOTE_PATH=/var/www/html/index.html URL=http://host/ ./deploy.sh   # serve at the site root instead
```
`deploy.sh` needs `REMOTE`, `KEY`, and `URL` set to your own host/key/public URL, and exits non-zero
unless the live page's md5 equals the local build.

## Features

- Study plan (4 weeks, checklist persisted), glossary with domain filter, flashcards, notes.
- **Practice exam**: 50 random questions / 45-minute timer (real exam: 40–60 questions, 45 min). Ends
  with a results panel: score vs the ~70 % pass line (700/1000), bar per domain with exam weight,
  per-objective table (this exam + all-time), "Study next" list with topics and jump links to missed
  questions, exam history trend.
- **Full bank**: all 160 questions, filter by domain or "Weak" (<60 % lifetime accuracy).
- Dark/light toggle (`az900-theme`), progress export/import.

## Question bank rules (enforced by hand + `tools/`)

Each `quizBank` item: `{ id, dom: 'd1'|'d2'|'d3', obj: '1.1'…'3.4', q, opts[4], correct: 0-3, explain }`.

1. `obj` is one of the 11 AZ-900 sub-objectives; `obj[0]` must match the domain digit.
2. Four options, exactly one correct, `correct` balanced ≈25 % per position over the bank
   (`tools/rebalance.js` reshuffles positions without touching text).
3. The correct option must not stand out by length: keep it within ~20 % of the next-longest option
   (the checker snippet lives in `tools/apply-rw2.js`). Distractors are real Azure services/concepts
   used wrongly — never "a type of virtual machine".
4. Bank order is interleaved across domains (`tools/mix-domains.js`, deficit algorithm) so the Full
   bank view never shows long same-domain runs.
5. No raw `'` inside strings (the bank is single-quoted JS) — use `’`.
6. ids are stable and never reused (lifetime stats and history are keyed by id).
7. The page has two `<script>` blocks; both must be syntax-checked (`build.py` does).
8. Any element with an explicit `display` needs a `selector[hidden] { display: none }` rule.

Domain counts at final state: d1 = 39, d2 = 67, d3 = 54 (Domain 2 is 35–40 % of the real exam).

## Hosting

Debian 12 LXC on Proxmox, 1 vCPU / 512 MB, nginx serving `/var/www/html`. `charset utf-8;` is set in
the default server block.
