#!/usr/bin/env bash
set -eu
# Determine git range: prefer Vercel env vars, fall back to HEAD^..HEAD
if [ -n "${VERCEL_GIT_PREVIOUS_SHA:-}" ] && [ -n "${VERCEL_GIT_COMMIT_SHA:-}" ]; then
  PREV="$VERCEL_GIT_PREVIOUS_SHA"
  CUR="$VERCEL_GIT_COMMIT_SHA"
else
  PREV="HEAD^"
  CUR="HEAD"
fi

# Get changed files (empty => treat as no-op)
FILES=$(git diff --name-only "$PREV" "$CUR" || true)
if [ -z "$FILES" ]; then
  # nothing changed — skip build
  exit 0
fi

# If any changed file is NOT under agents/, trigger build (exit 1).
# Otherwise (only agents/ changed) exit 0 to skip build.
if echo "$FILES" | grep -qvE '^agents/'; then
  exit 1
else
  exit 0
fi
