# aerorf-packages

Pacotes npm compartilhados: `@aerorf/shared` e `@aerorf/business-rules`.

## CI

Workflow `packages-ci.yml`: build → test → publish no GitHub Packages (push em `main`).

**Republish:** incremente `version` em `packages/shared/package.json` e `packages/business-rules/package.json` antes de mergear alterações.

## Desenvolvimento

```bash
npm install && npm run build && npm test
```

## Consumo

```ini
# .npmrc
@aerorf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

Repositório: https://github.com/AeroRF/aerorf-packages
