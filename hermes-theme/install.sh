#!/bin/bash
# Instala o tema Spotify no Hermes: nginx com CSS do login + fonte local.
# Rodar na VPS como root:  bash /opt/hermes/install-theme.sh
set -euo pipefail

# Arquivos buscados por hash de commit (conteudo imutavel, sem cache do CDN).
BASE="https://raw.githubusercontent.com/angelaleitte/projetos-dados/f3695eddfcb8f691de0b375bf5ecfabc325f8884/hermes-theme"
H=/opt/hermes
ROUTE=/data/traefik/dynamic/hermes.yml

mkdir -p "$H/nginx/theme/fonts" "$H/data/dashboard-themes"

# backups (rollback: veja o fim do script)
cp "$H/docker-compose.yml" "$H/docker-compose.yml.bak"
cp "$ROUTE" "$H/hermes-route.yml.bak"

# textos: remove CR por garantia; binarios (fontes): como estao
dl()  { curl -fsSL "$BASE/$1" | tr -d '\r' > "$2" && echo "baixado: $2"; }
dlb() { curl -fsSL "$BASE/$1" -o "$2" && echo "baixado: $2"; }

dl  nginx.conf                    "$H/nginx/default.conf"
dl  login.css                     "$H/nginx/theme/login.css"
dl  fonts.css                     "$H/nginx/theme/fonts.css"
dlb fonts/figtree-latin.woff2     "$H/nginx/theme/fonts/figtree-latin.woff2"
dlb fonts/figtree-latin-ext.woff2 "$H/nginx/theme/fonts/figtree-latin-ext.woff2"
dl  spotify.yaml                  "$H/data/dashboard-themes/spotify.yaml"
dl  docker-compose.yml            "$H/docker-compose.yml"

cd "$H"
echo "--- pre-check do nginx (nada foi alterado ainda) ---"
docker run --rm --add-host hermes:127.0.0.1 \
  -v "$H/nginx/default.conf:/etc/nginx/conf.d/default.conf:ro" \
  nginx:alpine nginx -t
docker compose config -q && echo "compose valido"
docker compose up -d
sleep 8

echo "--- teste interno do nginx ---"
docker exec hermes-web nginx -t
docker exec hermes-web wget -qO- http://127.0.0.1/_theme/fonts.css | head -n 2
echo -n "login recebe o CSS injetado (esperado 1): "
docker exec hermes-web wget -qO- http://127.0.0.1/login | grep -c "_theme/login.css" || true

echo "--- trocando a rota do Traefik para o nginx ---"
cat > "$ROUTE" <<'EOF'
http:
  routers:
    hermes:
      rule: "Host(`hermes.angelaleitte.com.br`)"
      entryPoints:
        - websecure
      service: hermes-svc
      tls:
        certResolver: letsencrypt
  services:
    hermes-svc:
      loadBalancer:
        servers:
          - url: "http://hermes-web:80"
EOF
echo "pronto."
echo "Rollback: cp $H/docker-compose.yml.bak $H/docker-compose.yml; cp $H/hermes-route.yml.bak $ROUTE; cd $H && docker compose up -d --remove-orphans"
