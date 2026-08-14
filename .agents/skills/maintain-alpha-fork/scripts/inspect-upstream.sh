#!/usr/bin/env bash
set -euo pipefail

usage() {
  printf 'Usage: %s [--fetch] [--upstream-ref <remote/ref>]\n' "$0"
}

fetch=false
upstream_ref="upstream/main"

while (($# > 0)); do
  case "$1" in
    --fetch)
      fetch=true
      shift
      ;;
    --upstream-ref)
      if (($# < 2)); then
        usage >&2
        exit 2
      fi
      upstream_ref="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

upstream_remote="${upstream_ref%%/*}"
upstream_branch="${upstream_ref#*/}"
if [[ "$upstream_remote" == "$upstream_ref" || -z "$upstream_branch" ]]; then
  printf 'Expected --upstream-ref in <remote>/<branch> form, got %s\n' "$upstream_ref" >&2
  exit 2
fi

if ! git remote get-url "$upstream_remote" >/dev/null 2>&1; then
  printf 'Missing remote %s. Configure the official T3 Code repository before syncing.\n' \
    "$upstream_remote" >&2
  exit 3
fi

if [[ "$fetch" == true ]]; then
  git fetch --no-tags --prune "$upstream_remote" "$upstream_branch"
fi

if ! git show-ref --verify --quiet "refs/remotes/$upstream_ref"; then
  printf 'Missing refs/remotes/%s. Run with --fetch first.\n' "$upstream_ref" >&2
  exit 4
fi

branch="$(git branch --show-current)"
head_sha="$(git rev-parse HEAD)"
upstream_sha="$(git rev-parse "$upstream_ref")"
merge_base="$(git merge-base HEAD "$upstream_ref")"
read -r ahead behind < <(git rev-list --left-right --count "HEAD...$upstream_ref")

if [[ -n "$(git status --porcelain)" ]]; then
  worktree_state="dirty"
else
  worktree_state="clean"
fi

origin_url="$(git remote get-url origin 2>/dev/null || printf '<missing>')"
upstream_url="$(git remote get-url "$upstream_remote")"
feature_count="$(find .alpha/features -type f -name '*.md' ! -name '_template.md' 2>/dev/null | wc -l | tr -d ' ')"

printf 'repo=%s\n' "$repo_root"
printf 'branch=%s\n' "${branch:-<detached>}"
printf 'worktree=%s\n' "$worktree_state"
printf 'origin=%s\n' "$origin_url"
printf 'upstream=%s\n' "$upstream_url"
printf 'head=%s\n' "$head_sha"
printf 'upstream_head=%s\n' "$upstream_sha"
printf 'merge_base=%s\n' "$merge_base"
printf 'ahead=%s\n' "$ahead"
printf 'behind=%s\n' "$behind"
printf 'active_feature_records=%s\n' "$feature_count"

printf '\nIncoming upstream commits:\n'
git log --oneline --no-merges "HEAD..$upstream_ref" | head -40 || true

printf '\nAlpha-only commits:\n'
git log --oneline --no-merges "$upstream_ref..HEAD" | head -40 || true

printf '\nChanged paths across divergence:\n'
git diff --name-status "HEAD...$upstream_ref" | head -120 || true
