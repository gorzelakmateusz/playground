#!/bin/bash
set -e

# Configuration
USERNAME="Piranessi"
TARGET_REPO="my-monorepo"

# Get list of all repositories except the target monorepo
REPOS=$(gh repo list "$USERNAME" --limit 1000 --json name -q '.[].name' | grep -v "^$TARGET_REPO$")

# Check if repository has any commits
if ! git rev-parse HEAD >/dev/null 2>&1; then
  echo "Repository has no commits yet."
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "You have uncommitted changes."
  exit 1
fi

# Process each repository
for repo in $REPOS; do
  # Remove existing directory if it exists
  if [ -d "$repo" ]; then
    rm -rf "$repo"
    git add -A
    git commit -m "Remove existing $repo before re-import"
  fi

  # Clean up any existing remote
  git remote remove "$repo" 2>/dev/null || true
  
  # Add remote for the repository
  git remote add "$repo" "https://github.com/$USERNAME/$repo.git"
  git fetch "$repo"

  # Determine the default branch (main or master)
  if git ls-remote --exit-code --heads "$repo" main >/dev/null 2>&1; then
    BRANCH="main"
  elif git ls-remote --exit-code --heads "$repo" master >/dev/null 2>&1; then
    BRANCH="master"
  else
    # Skip repositories without main/master branch
    git remote remove "$repo"
    continue
  fi

  # Add repository as subtree
  git subtree add --prefix="$repo" "$repo" "$BRANCH"
  
  # Clean up remote
  git remote remove "$repo"
done

echo "Import completed successfully."