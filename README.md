# Prospect AI — V1

Primeira versão do motor de verificação de website/domínio para prospecção local.

## Rodar

Requer Node.js 20+.

```bash
npm run check -- "Details Auto Services" "Saskatoon"
```

Também aceita domínios conhecidos para auditoria:

```bash
npm run check -- "Green Roots Landscaping" "Halifax" greenrootslandscaping.ca
```

## Estados

- `WEBSITE_FOUND`: domínio respondeu com um site acessível.
- `UNCERTAIN`: existe domínio/DNS, mas não foi possível confirmar um site atual.
- `NO_DOMAIN_FOUND`: nenhum dos domínios candidatos respondeu ao DNS.

**Importante:** `NO_DOMAIN_FOUND` não significa prova absoluta de inexistência. A V1 deliberadamente evita transformar incerteza em prospect confirmado.
