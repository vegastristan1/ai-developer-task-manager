<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:plan-backup -->

## Plan backup (power-loss recovery)

This project saves approved plans to `.aiagentconversationplan/` (gitignored — never commit its contents) so work can resume after a power outage or interrupted session.

- **Before any build/code changes after a plan is approved**: write the approved plan to `.aiagentconversationplan/<YYYY-MM-DD>-<topic>.md` and overwrite `.aiagentconversationplan/latest.md` with the same content. This is the first action, ahead of all edits.
- Plan file format: title, date, session id, status (`planned` / `in-progress` / `done`), steps as checkboxes (`- [ ]` / `- [x]`), and notes on decisions or gotchas.
- **On session start**: if `.aiagentconversationplan/latest.md` exists and its status is not `done`, surface it to the user first so interrupted work can be picked up.
- The `/saveplan` command saves the plan discussed in the current conversation using this same format.

<!-- END:plan-backup -->
