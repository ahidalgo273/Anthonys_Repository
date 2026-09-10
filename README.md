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
