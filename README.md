# Anthonys_Repository

## Claude Code: i-have-adhd skill

This repo ships the [i-have-adhd](https://github.com/ayghri/i-have-adhd) skill (MIT) for Claude Code.
It shapes responses for an ADHD reader: next action first, numbered steps, no preamble or closers, state restated each turn.

How it is wired:

- `.claude/skills/i-have-adhd/SKILL.md`: the ruleset. Invoke manually with `/i-have-adhd`.
- `.claude/settings.json`: a `SessionStart` hook that loads the rules automatically in every session opened in this repo.
- `.claude/hooks/i-have-adhd-always-on.sh`: the script the hook runs.

Controls:

- Say `stop adhd mode` or `normal mode` to turn it off for the current session.
- Remove the `SessionStart` entry from `.claude/settings.json` to stop auto-loading; `/i-have-adhd` still works on demand.

## Turn it on for every project on your computer

Run once from this repo folder (macOS, Linux, or Git Bash on Windows):

```sh
sh install-adhd-global.sh
```

It copies the skill and hook into `~/.claude/` and merges a `SessionStart` hook into `~/.claude/settings.json`. Re-running is safe. To undo, delete the `i-have-adhd` entry from that file.

## Claude Code: monthly-financial-close skill

Runs the owner-side review of the Go America LLC monthly books after the CPA sends the preliminary financials.

- `.claude/skills/monthly-financial-close/SKILL.md`: the four-step procedure (expenses for CapEx, GL 4111 audit, GPR review, draft reply).
- `.claude/skills/monthly-financial-close/references/background.md`: people, chart-of-accounts cheat sheet, past decisions, AppFolio query notes, and a lessons log.

Invoke with `/monthly-financial-close October 2026`. It needs the AppFolio Realm-X and Microsoft 365 connectors. It reads AppFolio, never changes it, and leaves the email as a draft.
