# Backend - RecolheTudo

Data: 20-05-2026  
Status: backend incremental para sync, analytics, rotas e pontos de coleta

## Objetivo

Este backend existe para tirar do cliente as responsabilidades que mais pesam na escalabilidade:

- sincronizacao entre dispositivos
- planejamento de rotas
- consolidacao de analytics
- controle de integracoes externas

O app continua offline-first com SQLite local como fonte operacional imediata.

## Endpoints

- `GET /health`
- `GET /ready`
- `POST /v1/sync`
- `GET /v1/collection-points/nearby`
- `POST /v1/routes/plan`
- `GET /v1/analytics/daily-summary`
- `GET /v1/analytics/weekly-summary`
- `GET /v1/analytics/summary`
- `GET /v1/analytics/materials`
- `GET /v1/analytics/productivity`

## Endpoints legados despublicados

- `POST /v1/collections/sync`
- `GET /v1/collections`
- `DELETE /v1/collections/:remoteId`

Esses endpoints hoje respondem como legados/indisponiveis para evitar uso inseguro sem autenticacao.

## Estado atual

Implementacao atual:

- servidor HTTP Node
- PostgreSQL para `collections` e `route_runs`
- request id e logs basicos
- readiness real do PostgreSQL
- roteirizacao via OSRM com fallback simples
- pontos de coleta seedados para permitir teste rapido
- `docker-compose.yml` sobe frontend web, backend e PostgreSQL juntos

## Integracao com o app

O cliente usa `EXPO_PUBLIC_API_BASE_URL` para decidir quando ativar a camada centralizada.

Hoje o app usa o backend primeiro para:

- `GET /health` no painel de inspecao
- `GET /ready` para readiness real do PostgreSQL
- `GET /v1/collection-points/nearby` para carregar pontos
- `POST /v1/routes/plan` para ordenacao e ETA
- `POST /v1/sync` para sincronizacao incremental de coletas criadas, atualizadas e excluidas
- `GET /v1/analytics/summary` para resumo centralizado diario/semanal

Se a API nao estiver disponivel, o app mantem o comportamento local.

## Rodando local

```bash
cp .env.example .env
npm run backend:dev
npm run web
```

Variaveis versionadas com placeholders:

```bash
.env.example
```

Observacoes:

- o repositorio nao deve versionar `.env`
- para `npm run backend:dev`, o backend carrega variaveis de `.env` na raiz do projeto
- para Docker, o `docker-compose.yml` le automaticamente as variaveis do mesmo `.env`

## Rodando com Docker

```bash
cp .env.example .env
docker-compose up postgres backend dev
```

URLs:

- frontend web: `http://localhost:8081`
- backend: `http://localhost:3001/health`
- PostgreSQL: `localhost:5432`

## Evolucao local offline-first

O SQLite local agora persiste tambem:

- `remote_id`
- `sync_status`
- `last_synced_at`
- tabela `sync_queue`

Fluxo atual:

- criar coleta salva no SQLite com `sync_status = pending_sync`
- a coleta entra em `sync_queue`
- quando houver backend configurado, a fila e drenada em modo best-effort via `POST /v1/sync`
- exclusao local remove a coleta e envia tombstone no proximo sync quando `remote_id` existir

## Contrato formal de sync

Documento formal:

- `docs/SYNC.md`

## Higiene de seguranca

Antes de publicar no GitHub:

- confirme que `.env` nao esta versionado
- confirme que nao existem dumps `.db`, `.sqlite`, logs ou caches no commit
- mantenha apenas `.env.example` com placeholders
- nunca comite `DATABASE_URL` com senha real, tokens ou credenciais de provedores

## Proximo passo recomendado

Para sair do bootstrap e virar backend de producao, a ordem correta e:

1. consolidar `materials` e `productivity` no cliente quando fizer sentido
2. evoluir reconciliacao completa de conflitos e retries com backoff
3. colocar autenticacao real e observabilidade mais forte
