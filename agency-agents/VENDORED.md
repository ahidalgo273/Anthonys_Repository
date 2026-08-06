# Vendored copy of agency-agents

- **Upstream**: https://github.com/msitarzewski/agency-agents.git
- **Commit**: `c89557f78509868c6d4cc08e5cbc79bc8625fe1c`
- **Vendored on**: 2026-08-06
- The upstream `.git` directory was removed; this is a plain folder, not a submodule.

## Updating

To pull a newer version, re-clone upstream and replace this folder (keep this file, updating the commit SHA):

```bash
git clone --depth 1 https://github.com/msitarzewski/agency-agents.git /tmp/agency-agents
rm -rf agency-agents && cp -r /tmp/agency-agents agency-agents && rm -rf agency-agents/.git
```

Then re-copy any divisions you use into `.claude/agents/` (see the repo root README).
