# Moved Files Log

> **Generated:** 2026-01-20 | **Reorganization Version:** 1.0

## Files Moved to `/docs/`

| Original Location | New Location |
|-------------------|--------------|
| `/ARCHITECTURE.md` | `/docs/ARCHITECTURE.md` |
| `/API_REFERENCE.md` | `/docs/API_REFERENCE.md` |
| `/AI_AGENT_SETUP.md` | `/docs/AI_AGENT_SETUP.md` |
| `/PAPER_TRADING.md` | `/docs/PAPER_TRADING.md` |
| `/PROJECT_SUMMARY.md` | `/docs/PROJECT_SUMMARY.md` |
| `/QUICKSTART.md` | `/docs/QUICKSTART.md` |
| `/SETUP.md` | `/docs/SETUP.md` |

## Files Moved to `/scripts/`

| Original Location | New Location |
|-------------------|--------------|
| `/start_bot_with_ai.bat` | `/scripts/start_bot_with_ai.bat` |
| `/start_robust.ps1` | `/scripts/start_robust.ps1` |
| `/debug_ollama.py` | `/scripts/debug_ollama.py` |
| `/monitor_trades.py` | `/scripts/monitor_trades.py` |
| `/verify_installation.py` | `/scripts/verify_installation.py` |

## Files Moved to `/archive/`

| Original Location | New Location | Reason |
|-------------------|--------------|--------|
| `/dashboard.html` | `/archive/dashboard.html` | Legacy standalone dashboard |
| `/temp_pw/` | `/archive/temp_pw/` | Temporary playwright files |

## Deleted Files (Temporary/Backup)

| File Pattern | Count | Reason |
|--------------|-------|--------|
| `tmpclaude-*-cwd` | 72 | Temporary working directory files |
| `playwright.config.js.bak` | 1 | Backup file |
| `nul` | 1 | Empty file artifact |
| `task.md` | 1 | Duplicate (exists in artifacts) |

## Deleted Directories

| Directory | Reason |
|-----------|--------|
| `/test-results/` | Generated test artifacts (95 files) |
| `/playwright-report/` | Generated report data (29 files) |

## Summary

- **Files moved:** 14
- **Files deleted:** 75
- **Directories deleted:** 2
- **New directories created:** 3 (`/docs/`, `/scripts/`, `/archive/`)

## Updated .gitignore Patterns

The following should be in `.gitignore`:
```
# Temporary files
tmpclaude-*
*.tmp
*.bak
nul

# Generated artifacts
test-results/
playwright-report/

# Dependencies
node_modules/
target/
venv/

# Build output
frontend/build/
dist/
```
