#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${NPM_REGISTRY:-https://npm.pkg.github.com}"

PACKAGES=(
  "packages/shared"
  "packages/business-rules"
)

publish_if_new() {
  local dir="$1"
  local name version staging tarball

  name="$(node -p "require('./${dir}/package.json').name")"
  version="$(node -p "require('./${dir}/package.json').version")"

  if npm view "${name}@${version}" version --registry="$REGISTRY" >/dev/null 2>&1; then
    echo "Skip ${name}@${version} (already published)"
    return 0
  fi

  if [[ ! -d "${dir}/dist" ]]; then
    echo "Missing ${dir}/dist — run npm run build first" >&2
    exit 1
  fi

  staging="$(mktemp -d)"
  trap 'rm -rf "${staging}"' RETURN

  cp -R "${dir}/dist" "${staging}/dist"
  node <<NODE
const fs = require('fs');
const src = './${dir}/package.json';
const pkg = JSON.parse(fs.readFileSync(src, 'utf8'));
delete pkg.repository;
delete pkg.scripts;
delete pkg.devDependencies;
fs.writeFileSync('${staging}/package.json', JSON.stringify(pkg, null, 2));
NODE

  echo "Publishing ${name}@${version} (tarball from staging dir)"
  tarball="$(npm pack "${staging}" --pack-destination /tmp --ignore-scripts 2>/dev/null | tail -1)"
  if [[ -z "${tarball}" || ! -f "/tmp/${tarball}" ]]; then
    echo "Failed to create tarball for ${name}" >&2
    exit 1
  fi

  npm publish "/tmp/${tarball}" \
    --access public \
    --registry="${REGISTRY}" \
    --provenance=false \
    --ignore-scripts

  rm -f "/tmp/${tarball}"
}

for dir in "${PACKAGES[@]}"; do
  publish_if_new "$dir"
done
