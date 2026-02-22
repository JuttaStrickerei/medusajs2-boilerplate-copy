#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

errors=0

echo "╔════════════════════════════════════════╗"
echo "║     DEV SESSION END — QUALITY GATE     ║"
echo "╚════════════════════════════════════════╝"
echo ""

# 1. Backend build
echo -n "1. Backend build... "
if (cd "$PROJECT_ROOT/backend" && pnpm build > /dev/null 2>&1); then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  errors=$((errors + 1))
fi

# 2. Storefront build
echo -n "2. Storefront build... "
if (cd "$PROJECT_ROOT/storefront" && pnpm build > /dev/null 2>&1); then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  errors=$((errors + 1))
fi

# 3. No console.log in backend source
echo -n "3. No console.log in backend source... "
CONSOLE_MATCHES=$(grep -rn 'console\.log' "$PROJECT_ROOT/backend/src/" --include='*.ts' --include='*.tsx' | grep -v '\.test\.' | grep -v '__test__' | grep -v '//.*console\.log' || true)
if [ -z "$CONSOLE_MATCHES" ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${YELLOW}WARN${NC}"
  echo "$CONSOLE_MATCHES" | head -5
  if [ "$(echo "$CONSOLE_MATCHES" | wc -l)" -gt 5 ]; then
    echo "  ... and more"
  fi
fi

# 4. No @ts-nocheck in source
echo -n "4. No @ts-nocheck... "
TS_NOCHECK=$(grep -rn '@ts-nocheck' "$PROJECT_ROOT/backend/src/" "$PROJECT_ROOT/storefront/src/" --include='*.ts' --include='*.tsx' || true)
if [ -z "$TS_NOCHECK" ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL${NC}"
  echo "$TS_NOCHECK"
  errors=$((errors + 1))
fi

# 5. Memory files exist
echo -n "5. Memory files exist... "
if [ -f "$PROJECT_ROOT/.cursor/memory/decisions.md" ] && [ -f "$PROJECT_ROOT/.cursor/memory/changelog.md" ] && [ -f "$PROJECT_ROOT/.cursor/memory/context.md" ]; then
  echo -e "${GREEN}PASS${NC}"
else
  echo -e "${RED}FAIL — create .cursor/memory/ files${NC}"
  errors=$((errors + 1))
fi

# 6. Memory freshness reminder
echo -n "6. Memory freshness... "
if [ -f "$PROJECT_ROOT/.cursor/memory/changelog.md" ]; then
  LAST_MOD=$(stat -f "%Sm" -t "%Y-%m-%d" "$PROJECT_ROOT/.cursor/memory/changelog.md" 2>/dev/null || stat -c "%y" "$PROJECT_ROOT/.cursor/memory/changelog.md" 2>/dev/null | cut -d' ' -f1)
  TODAY=$(date +%Y-%m-%d)
  if [ "$LAST_MOD" = "$TODAY" ]; then
    echo -e "${GREEN}PASS (updated today)${NC}"
  else
    echo -e "${YELLOW}WARN — changelog.md last updated $LAST_MOD — update if you made changes${NC}"
  fi
else
  echo -e "${YELLOW}WARN — no changelog.md found${NC}"
fi

echo ""
if [ $errors -gt 0 ]; then
  echo -e "${RED}$errors check(s) failed. Fix before committing.${NC}"
  exit 1
else
  echo -e "${GREEN}All checks passed. Ready to commit.${NC}"
fi
