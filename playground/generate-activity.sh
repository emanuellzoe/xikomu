#!/usr/bin/env bash
#
# playground/generate-activity.sh
#
# Generates incremental "utility" GitHub activity, fully sandboxed to playground/.
# Each commit appends ONE utility (u-N) to three files; commits are grouped into
# PRs that are created and merged into main automatically.
#
# It NEVER touches anything outside playground/ (except this script, already on main).
#
# Usage:
#   playground/generate-activity.sh [PR_COUNT] [COMMITS_PER_PR] [START_PR] [START_COUNTER]
#
# Defaults: PR_COUNT=20  COMMITS_PER_PR=5
#   START_COUNTER : auto-detected as (last u-N in CHANGELOG)+1, else 1
#   START_PR      : 1 (cosmetic — appears in PR titles as "batch <i>")
#
# Requires: gh (logged in), git, a clean working tree on a repo whose default
# branch is main.
set -euo pipefail

# --- repo root + paths -------------------------------------------------------
ROOT="$(git rev-parse --show-toplevel)"
cd "$ROOT"
PG="playground"
CSS="$PG/styles.css"
HTML="$PG/index.html"
LOG="$PG/CHANGELOG.md"

# --- params ------------------------------------------------------------------
PR_COUNT="${1:-20}"
COMMITS_PER_PR="${2:-5}"
START_PR="${3:-1}"

# Auto-detect the next utility number from the CHANGELOG unless overridden.
detect_counter() {
  if [[ -f "$LOG" ]]; then
    local last
    last="$(grep -oE '^- u-[0-9]+' "$LOG" | grep -oE '[0-9]+' | sort -n | tail -1 || true)"
    if [[ -n "${last:-}" ]]; then echo $((last + 1)); return; fi
  fi
  echo 1
}
START_COUNTER="${4:-$(detect_counter)}"

RUN_ID="$(date +%Y%m%d-%H%M%S)"

# 10-color palette; index = (N-1) % 10
PALETTE=(\#2563eb \#16a34a \#dc2626 \#d97706 \#7c3aed \#0891b2 \#db2777 \#65a30d \#ea580c \#0d9488)

echo "Run $RUN_ID :: $PR_COUNT PRs x $COMMITS_PER_PR commits, starting at u-$START_COUNTER, PR batch $START_PR"

# --- ensure playground scaffold exists (created on the feature branch) --------
ensure_scaffold() {
  mkdir -p "$PG"
  [[ -f "$CSS" ]]  || printf '/* playground utilities — auto-generated, sandboxed */\n' > "$CSS"
  [[ -f "$HTML" ]] || printf '<!doctype html>\n<meta charset="utf-8">\n<title>playground</title>\n<link rel="stylesheet" href="styles.css">\n' > "$HTML"
  [[ -f "$LOG" ]]  || printf '# Playground changelog\n\n' > "$LOG"
}

counter="$START_COUNTER"

for ((i = 0; i < PR_COUNT; i++)); do
  pr_index=$((START_PR + i))
  nn="$(printf '%02d' "$pr_index")"
  branch="playground/${RUN_ID}-pr${nn}"

  # Always branch from a fresh main to avoid conflicts.
  git checkout main
  git pull --ff-only origin main

  git checkout -b "$branch"
  ensure_scaffold

  utilities=()
  for ((j = 1; j <= COMMITS_PER_PR; j++)); do
    N="$counter"
    color="${PALETTE[$(((N - 1) % 10))]}"

    printf '.u-%d { padding: %dpx; border-radius: 4px; background: %s; color: #fff; }\n' "$N" "$N" "$color" >> "$CSS"
    printf '<div class="u-%d">box u-%d</div>\n' "$N" "$N" >> "$HTML"
    printf -- '- u-%d: add utility (bg %s, pad %dpx)\n' "$N" "$color" "$N" >> "$LOG"

    git add "$CSS" "$HTML" "$LOG"
    git commit -q -m "playground: add utility u-${N} (PR ${pr_index}, commit ${j})"

    utilities+=("u-${N}")
    counter=$((counter + 1))
  done

  git push -q -u origin "$branch"

  util_csv="$(IFS=', '; echo "${utilities[*]}")"
  gh pr create \
    --base main --head "$branch" \
    --title "Playground activity batch ${pr_index} (run ${RUN_ID})" \
    --body "Auto-generated incremental utilities: ${util_csv}. Folder: playground/ only."

  gh pr merge "$branch" --merge --delete-branch

  git checkout main
  git pull --ff-only origin main
  echo "  ✓ PR ${pr_index} merged (${util_csv})"
done

echo "Done. Created $PR_COUNT PRs, $((PR_COUNT * COMMITS_PER_PR)) commits, up to u-$((counter - 1))."
