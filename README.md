# aerorf-packages

Pacotes npm compartilhados entre backend e frontend AeroRF.

| Pacote | Descrição |
|---|---|
| `@aerorf/shared` | Tipos, DTOs e constantes |
| `@aerorf/business-rules` | Regras puras (bloqueio de voo, cotas, permissões) |

## Desenvolvimento

```bash
npm install
npm run build
npm test
```

## Publicação (GitHub Packages)

Merge em `main` dispara o workflow que publica em `https://npm.pkg.github.com`.

Consumo nos outros repos (`.npmrc`):

```ini
@aerorf:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

```json
"@aerorf/shared": "1.0.0",
"@aerorf/business-rules": "1.0.0"
```

## Repositório

https://github.com/AeroRF/aerorf-packages
