---
description: Save current plan to .aiagentconversationplan (power-loss backup)
---

Save the plan discussed in this conversation to `.aiagentconversationplan/` following the format defined in AGENTS.md:

1. Write `<YYYY-MM-DD>-<topic>.md` (topic = short kebab-case slug from the plan's subject).
2. Overwrite `latest.md` with the same content.
3. Include title, date, session id, status (`planned` / `in-progress` / `done`), steps as checkboxes, and notes.

Reply with the file path(s) written. This folder is gitignored — never commit its contents.
