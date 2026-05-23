# SPEC Tecnica - RecolheTudo

Data: 20-05-2026  
Status: atualizada para refletir o estado atual do cliente e da API

## 1. Stack atual

### Cliente

- Expo SDK 53
- React Native 0.79
- React 19
- TypeScript strict
- Zustand
- expo-sqlite
- expo-location
- react-native-maps
- React Navigation bottom tabs

### Backend

- Node.js
- HTTP nativo
- PostgreSQL
- `pg`

### Qualidade

- Jest
- `node --test` no backend
- `tsc --noEmit`

## 2. Arquitetura atual

### Cliente

```text
Screen
  -> Zustand store
  -> service
  -> repository
  -> SQLite local

Screen
  -> Zustand store
  -> service
  -> backend HTTP
  -> PostgreSQL / seeds / OSRM
```

### Backend

```text
HTTP server
  -> middleware opcional de auth context
  -> schemas e validadores
  -> services
  -> repository PostgreSQL
  -> PostgreSQL

collection points
  -> seed em memoria

route planning
  -> OSRM com fallback
```

## 3. Navegacao e telas

Tabs atuais em `src/navigation/AppNavigator.tsx`:

- `Inicio`
- `Coleta`
- `Historico`
- `Rotas`
- `Perfil`

### 3.1 Inicio

Responsabilidades:

- carregar resumo diario
- carregar resumo semanal
- exibir cards por material
- abrir atalhos para `Coleta`, `Rotas` e `Historico`

Fonte atual dos dados:

- tenta backend para analytics
- cai para SQLite local se a API falhar

### 3.2 Coleta

Responsabilidades:

- escolher material
- escolher faixa de peso
- confirmar registro
- solicitar localizacao
- salvar localmente
- disparar sync best-effort

### 3.3 Historico

Responsabilidades:

- listar coletas recentes
- filtrar por material
- excluir coleta local
- reprocessar estado de dashboard

### 3.4 Rotas

Responsabilidades:

- carregar localizacao atual quando disponivel
- buscar pontos proximos
- planejar rota via backend quando disponivel
- abrir navegacao externa no Google Maps

### 3.5 Perfil

Responsabilidades:

- meta diaria local
- resumo semanal
- status offline
- leitura de health do backend

## 4. Persistencia local

Arquivo central:

- `src/data/database.ts`

Tabelas locais relevantes:

- `collections`
- `route_points`
- `collection_points`
- `schema_version`
- `sync_queue`

Campos importantes em `collections`:

- `id`
- `material`
- `weight_range`
- `weight_kg`
- `estimated_weight_kg`
- `latitude`
- `longitude`
- `location_accuracy`
- `collected_at`
- `created_at`
- `notes`
- `remote_id`
- `sync_status`
- `last_synced_at`

## 5. Sync offline-first

### Estrategia atual

1. coleta e salva primeiro no SQLite
2. uma entrada e criada em `sync_queue`
3. `collectionsSyncService` tenta drenar a fila
4. falhas remotas nao bloqueiam a UX

### Operacoes de fila

- `upsert`
- `delete`

### Status locais

- `pending_sync`
- `synced`
- `sync_error`

## 6. Backend atual

Entrypoint:

- `backend/src/server.mjs`

Config:

- `backend/src/config/env.mjs`

Middleware e utilitarios:

- `backend/src/middleware/auth-context.mjs`
- `backend/src/utils/request-id.mjs`
- `backend/src/utils/logger.mjs`
- `backend/src/utils/http-error.mjs`

### Endpoints

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

### Endpoints legados despublicados

- `POST /v1/collections/sync`
- `GET /v1/collections`
- `DELETE /v1/collections/:remoteId`

### Persistencia do backend

PostgreSQL atual:

- `collections`
- `route_runs`

Seeds ainda em memoria:

- pontos de coleta base

## 7. Planejamento de rotas

Backend:

- usa OSRM quando disponivel
- faz fallback com `provider: "none"` e `fallback: true` quando houver falha

Cliente:

- consome rota planejada
- exibe resumo de distancia e duracao
- permite abrir Google Maps com destino selecionado

## 8. Analytics

### Atual no cliente

- dashboard principal tenta backend primeiro para analytics
- se a API falhar, cai para SQLite local
- o app continua offline-first

### Atual no backend

- existem endpoints para resumo diario e semanal
- existe `summary` flexivel por periodo
- existe `materials`
- existe `productivity`
- o backend persiste colecoes e calcula agregacoes

### Gap conhecido

- autenticacao completa ainda nao existe
- `user_id` e `device_id` ja estao preparados, mas sem JWT obrigatorio
- reconciliacao de conflitos ainda esta em nivel MVP

## 9. Configuracao e seguranca

### Arquivos de ambiente

- `.env.example` versionado
- `.env` apenas local

Variaveis relevantes:

- `EXPO_PUBLIC_API_BASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `POSTGRES_HOST`
- `DATABASE_URL`

### Regras

- nao versionar `.env`
- nao versionar bancos locais
- nao hardcodar credenciais reais em codigo ou docs

## 10. Docker e infraestrutura

Arquivo principal:

- `docker-compose.yml`

Servicos:

- `postgres`
- `backend`
- `dev`
- `test`
- `build`

Uso principal:

```powershell
docker-compose up postgres backend dev
```

## 11. Scripts operacionais

### Cliente

```powershell
npx expo start
npm run web
```

### Backend

```powershell
npm run backend:dev
npm run backend:check
npm --prefix backend run test
```

### Validacao

```powershell
npm run typecheck
npm run test:run
```

## 12. Testes atuais

Cobertura existente em alto nivel:

- validacao de coleta
- repositorio de coletas
- pontos de rota
- pontos de coleta
- sync de pontos de reciclagem
- store de coletas
- utilitarios de mapas
- sync do cliente
- readiness do backend
- sync do backend
- analytics de backend
- fallback de rota

## 13. Limitacoes e debitos tecnicos conhecidos

- JWT ainda nao esta ativo
- conflitos de sync ainda estao em nivel MVP
- pontos de coleta do backend ainda dependem parcialmente de seeds
- analytics `materials` e `productivity` ainda nao sao consumidos pelas telas

## 14. Proximas correcoes prioritarias

1. consolidar `materials` e `productivity` no cliente quando fizer sentido
2. evoluir reconciliacao de conflitos
3. adicionar middleware real de autenticacao com JWT
4. revisar escopo por usuario/device
5. fortalecer observabilidade e testes HTTP de integracao
