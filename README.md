# Anthonys_Repository

## Agency Agents

This repo is set up with [Agency Agents](https://github.com/msitarzewski/agency-agents) — a library of specialized AI agent personas for Claude Code.

- **`.claude/agents/`** — 139 installed agents from the core work divisions: `engineering`, `design`, `product`, `project-management`, `testing`, `marketing`, `sales`, `finance`. Claude Code loads these automatically as project subagents in any session on this repo.
- **`agency-agents/`** — vendored full copy of the upstream project (230+ agents across all divisions, plus install/convert scripts). See `agency-agents/VENDORED.md` for the pinned commit and update instructions.

### Using the agents

In a Claude Code session, run `/agents` to browse them, ask for one by name (e.g. "have the backend architect review this"), or just describe a task — Claude delegates to a matching agent automatically.

### Installing more divisions

Copy any other division from the vendored source into the agents folder, e.g.:

```bash
cp -r agency-agents/security .claude/agents/security
```

Available extra divisions: `academic`, `game-development`, `gis`, `healthcare`, `paid-media`, `security`, `spatial-computing`, `specialized`, `strategy`, `support`.
