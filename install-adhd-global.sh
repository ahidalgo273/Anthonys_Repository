#!/usr/bin/env sh
# Installs the i-have-adhd skill globally for Claude Code on this machine:
#   ~/.claude/skills/i-have-adhd/SKILL.md   -> /i-have-adhd works in every project
#   ~/.claude/hooks/i-have-adhd-always-on.sh
#   ~/.claude/settings.json                 -> SessionStart hook, always-on everywhere
# Re-running is safe. Requires python3 (ships with macOS; on Windows use Git Bash + python).
set -e
here=$(cd "$(dirname -- "$0")" && pwd)
cfg="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

mkdir -p "$cfg/skills/i-have-adhd" "$cfg/hooks"
cp "$here/.claude/skills/i-have-adhd/SKILL.md" "$cfg/skills/i-have-adhd/SKILL.md"
cp "$here/.claude/skills/i-have-adhd/LICENSE"  "$cfg/skills/i-have-adhd/LICENSE"

# Global variant of the hook: reads SKILL.md from the global skills dir.
sed 's#^root=.*#root="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"#; s#\$root/.claude/skills/#$root/skills/#; s#always-on for this repository#always-on globally#; s#remove the SessionStart entry in .claude/settings.json#remove the SessionStart entry in ~/.claude/settings.json#' \
  "$here/.claude/hooks/i-have-adhd-always-on.sh" > "$cfg/hooks/i-have-adhd-always-on.sh"
chmod +x "$cfg/hooks/i-have-adhd-always-on.sh"

# Merge the SessionStart hook into ~/.claude/settings.json without clobbering other settings.
CFG="$cfg" python3 - <<'PY'
import json, os
cfg = os.environ["CFG"]
path = os.path.join(cfg, "settings.json")
data = {}
if os.path.exists(path):
    with open(path) as f:
        data = json.load(f) or {}
hook_cmd = 'sh "$HOME/.claude/hooks/i-have-adhd-always-on.sh"'
if os.environ.get("CLAUDE_CONFIG_DIR"):
    hook_cmd = 'sh "$CLAUDE_CONFIG_DIR/hooks/i-have-adhd-always-on.sh"'
entry = {
    "matcher": "startup|resume|clear|compact",
    "hooks": [{"type": "command", "command": hook_cmd, "timeout": 30,
               "statusMessage": "Loading i-have-adhd rules..."}],
}
hooks = data.setdefault("hooks", {})
starts = hooks.setdefault("SessionStart", [])
starts = [s for s in starts if "i-have-adhd" not in json.dumps(s)]
starts.append(entry)
hooks["SessionStart"] = starts
with open(path, "w") as f:
    json.dump(data, f, indent=2)
    f.write("\n")
print("Wrote", path)
PY

echo "Installed. Skill: $cfg/skills/i-have-adhd  Hook: $cfg/hooks/i-have-adhd-always-on.sh"
echo "Test: start 'claude' in any folder. Say 'stop adhd mode' to pause for a session."
