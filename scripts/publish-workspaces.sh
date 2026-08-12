#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${NPM_REGISTRY:-https://npm.pkg.github.com}"

PACKAGES=(
  "packages/shared"
  "packages/business-rules"
)

publish_if_new() {
  local dir="$1"
  local name version

  name="$(node -p "require('./${dir}/package.json').name")"
  version="$(node -p "require('./${dir}/package.json').version")"

  if npm view "${name}@${version}" version --registry="$REGISTRY" >/dev/null 2>&1; then
    echo "Skip ${name}@${version} (already published)"
    return 0
  fi

  echo "Publishing ${name}@${version} from ${dir}"
  npm publish "${dir}" --access public --registry="$REGISTRY"
}

for dir in "${PACKAGES[@]}"; do
  publish_if_new "$dir"
done
