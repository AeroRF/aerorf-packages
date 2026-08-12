#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${NPM_REGISTRY:-https://npm.pkg.github.com}"

if [ "$#" -eq 0 ]; then
  set -- @aerorf/shared @aerorf/business-rules
fi

publish_if_new() {
  local ws="$1"
  local version
  version="$(npm pkg get version -w "$ws" | tr -d '"')"

  if npm view "${ws}@${version}" version --registry="$REGISTRY" >/dev/null 2>&1; then
    echo "Skip ${ws}@${version} (already published)"
    return 0
  fi

  echo "Publishing ${ws}@${version}"
  npm publish -w "$ws" --access public --registry="$REGISTRY"
}

for ws in "${WORKSPACES[@]}"; do
  publish_if_new "$ws"
done
