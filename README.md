# Projetos — dados.angelaleite.com

Página inicial (hub) do portfólio de projetos. Cada projeto vive em sua própria
pasta/rota dentro do mesmo domínio, compartilhando um único banco de dados.

```
dados.angelaleite.com/           → esta página (hub)
dados.angelaleite.com/gripe/     → Projeto SRAG (Dash + MySQL)
dados.angelaleite.com/<novo>/    → próximos projetos
```

---

## Visão geral da arquitetura

- **VPS**: Hostinger, IP `76.13.168.152`, gerenciada via [Coolify](https://coolify.angelaleitte.com.br)
- **Banco de dados**: um único MySQL (`srag-mysql`, recurso "Database" nativo do
  Coolify) compartilhado por todos os projetos. Projeto novo → tabelas novas
  nesse mesmo banco, não um banco novo.
- **Cada projeto = um app separado no Coolify** (seu próprio container), com
  rota própria (`PathPrefix`) no mesmo domínio.
- **Roteamento**: existe um **Traefik separado do Coolify** rodando nessa VPS
  (container `traefik`, fora da gestão do Coolify — foi configurado
  manualmente antes, junto com n8n/Evolution). O proxy interno do próprio
  Coolify (`coolify-proxy`) não é usado — ele fica sempre "Exited" porque o
  Traefik manual já ocupa as portas 80/443. **Isso é esperado, não é bug.**
- As rotas de `dados.angelaleite.com` são definidas manualmente em
  `/data/traefik/dynamic/dados-angelaleite.yml` na VPS (Traefik "file
  provider"), não pelos labels automáticos do Coolify.
- Os containers dos apps desse domínio precisam estar na rede Docker
  `proxy` (rede manual, diferente da rede `coolify` que o Coolify usa por
  padrão) para o Traefik conseguir alcançá-los.
- Um serviço systemd (`coolify-network-fix.service`) fica de olho nos
  containers novos e já os conecta na rede `proxy` automaticamente a cada
  deploy — **desde que o prefixo do container esteja cadastrado nesse
  script** (ver passo 5 abaixo).

---

## Estrutura deste repositório

```
index.html   — estrutura da página
style.css    — identidade visual: Design System inspirado no Spotify (fundo
               #121212, verde #1ed760 só em ações/estados ativos, pílulas,
               botões em caixa alta). Fonte Figtree no lugar da SpotifyMixUI,
               que é proprietária.
script.js    — array `projects` (conteúdo do carrossel) + lógica de rotação/tema
```

Para editar textos, cores ou adicionar um projeto ao carrossel, mexa só no
`script.js` (array `projects` no topo do arquivo) — cada objeto ali é um
slide.

---

## Passo a passo: adicionar um projeto novo

Exemplo hipotético: um projeto novo chamado **"clima"**, que vai ficar em
`dados.angelaleite.com/clima/`.

### 1. Criar o app no Coolify

Repositório Git próprio (pode ser público, como os atuais) → criar aplicação
no Coolify (build pack conforme a stack do projeto: Dockerfile, Docker
Compose, static, etc.), no mesmo projeto/ambiente dos outros
(`projeto-gripe-srag` / `production`), **sem** configurar domínio pelo campo
"Domains" do Coolify (o roteamento é manual, ver passo 3).

### 2. Se o projeto tiver frontend com rotas próprias (ex: Dash, Flask, React
com router), configurar o "base path" `/clima/` no próprio código

Exemplo (Dash, como foi feito no projeto `/gripe`):
```python
app = dash.Dash(__name__, url_base_pathname="/clima/")
```
Sem isso, os assets internos (JS/CSS) do framework quebram quando acessados
por baixo de uma subpasta.

### 3. Conectar ao banco compartilhado (se precisar de dados)

Use a mesma string de conexão do banco `srag-mysql`, só trocando o nome da
tabela/schema conforme a necessidade do projeto novo. Peça as credenciais
atuais no painel do Coolify → recurso `srag-mysql` → aba de detalhes (não
deixe hardcoded no código — sempre como variável de ambiente `DATABASE_URL`
ou similar).

### 4. Adicionar a rota no Traefik

Editar `/data/traefik/dynamic/dados-angelaleite.yml` na VPS, acrescentando um
router + service novos (o arquivo é recarregado sozinho, sem precisar
reiniciar nada):

```yaml
http:
  routers:
    # ...routers existentes (dados-app, hub-app)...
    clima-app:
      rule: "Host(`dados.angelaleite.com`) && PathPrefix(`/clima`)"
      entryPoints:
        - websecure
      service: clima-app-svc
      priority: 100
      tls:
        certResolver: letsencrypt
  services:
    # ...services existentes...
    clima-app-svc:
      loadBalancer:
        servers:
          - url: "http://clima-app:<PORTA_INTERNA_DO_APP>"
```

Rotas com `PathPrefix` precisam de `priority` maior que a da rota da hub
(`hub-app`, que usa `priority: 1` e captura tudo em `/`), senão o Traefik
pode rotear errado.

### 5. Conectar o container na rede `proxy`

Achar o nome do container novo:
```bash
docker ps --filter "name=<uuid-do-app-no-coolify>" --format "{{.Names}}"
```

Conectar manualmente (uma vez, pra funcionar já):
```bash
docker network connect --alias clima-app proxy <nome-do-container>
```

E cadastrar no script de auto-reconexão, editando
`/usr/local/bin/coolify-network-fix.sh` (adicionar mais um `case`):
```bash
clima-app-uuid-do-coolify-*) alias="clima-app" ;;
```
depois `sudo systemctl restart coolify-network-fix.service`.

### 6. Adicionar o card no carrossel da hub

Em `script.js` deste repositório, adicionar um objeto novo no array
`projects`:
```js
{
  tag: "Categoria do projeto",
  title: 'Título com <span class="accent">destaque</span>.',
  description: "Descrição curta do projeto.",
  cta: "Ver projeto",
  link: "/clima/",
  visual: `<svg>...</svg>`, // ilustração do card
},
```
Commit + push → o deploy no Coolify pode ser automático (webhook) ou manual.

---

## Referência rápida

| Item | Valor |
|---|---|
| Domínio | `dados.angelaleite.com` |
| VPS | `76.13.168.152` (Hostinger) |
| Painel Coolify | `https://coolify.angelaleitte.com.br` |
| Projeto no Coolify | `projeto-gripe-srag` / ambiente `production` |
| Banco compartilhado | recurso `srag-mysql` no Coolify |
| Config do Traefik manual | `/data/traefik/dynamic/dados-angelaleite.yml` (na VPS) |
| Script de auto-rede | `/usr/local/bin/coolify-network-fix.sh` (na VPS) |
| Serviço systemd | `coolify-network-fix.service` |
| Rede Docker do proxy | `proxy` |

---

## Problemas comuns

**Página nova dá 404 ou 502 depois do deploy**
→ O container provavelmente não está na rede `proxy`. Rode o `docker network
connect` do passo 5 manualmente, e confirme que o prefixo do container está
cadastrado no script de auto-reconexão pros próximos deploys.

**Assets (CSS/JS) do app quebrados quando acessado pela subpasta**
→ Falta configurar o "base path" do framework (passo 2).

**O painel do Coolify mostra o proxy dele (`coolify-proxy`) como "Exited"**
→ Normal nessa VPS. O Traefik de verdade é outro container (`traefik`,
fora do Coolify) e quem faz o roteamento de `dados.angelaleite.com` é o
arquivo manual do passo 4, não o Coolify.
