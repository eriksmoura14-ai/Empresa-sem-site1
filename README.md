# Prospect AI — V2 Free

Descoberta local sem Google Places, sem Google Cloud e sem API paga obrigatória.

## Teste
`npm install`
`npm run discover -- "Saskatoon" "auto detailing" 30`

Fluxo: cidade + nicho → OpenStreetMap/Overpass → verificação de site/domínio → prospects.

`NO_DOMAIN_FOUND` não é prova absoluta de inexistência de site; casos incertos permanecem separados.
