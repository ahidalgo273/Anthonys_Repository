#!/usr/bin/env sh
# SessionStart hook: injects the i-have-adhd ruleset into every session opened
# in this repository. Adapted from https://github.com/ayghri/i-have-adhd (MIT).
# Never blocks session start: any failure exits 0.
#
# To pause it for one session, say "stop adhd mode".
# To disable it for good, remove the SessionStart entry in .claude/settings.json.

root="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname -- "$0")/../.." && pwd)}"
skill_path="$root/.claude/skills/i-have-adhd/SKILL.md"
[ -f "$skill_path" ] || exit 0

# Strip the leading YAML frontmatter block (--- ... ---) if it is closed.
body=$(awk '
  NR == FNR {
    if (NR == 1 && $0 ~ /^---[[:space:]]*$/) { in_fm = 1; next }
    if (in_fm && $0 ~ /^---[[:space:]]*$/)   { in_fm = 0; closed = 1 }
    next
  }
  FNR == 1 { strip = closed }
  strip && FNR == 1 && $0 ~ /^---[[:space:]]*$/ { skipping = 1; next }
  skipping && $0 ~ /^---[[:space:]]*$/          { skipping = 0; next }
  !skipping { print }
' "$skill_path" "$skill_path") || exit 0

printf 'ADHD MODE ACTIVE (always-on for this repository). The ruleset below applies to every response. "stop adhd mode" turns it off for this session.\n\n%s\n' "$body"
