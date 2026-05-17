# SPEC Técnica - RecolheTudo

Data: 17-05-2026  
Status: atualizado para refletir a base atual

## 1. Stack atual

### Cliente

- Expo SDK 53
- React Native 0.79
- React 19
- TypeScript
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
  -> services
  -> repository PostgreSQL
  -> PostgreSQL

collection points
  -> seed em memória

route planning
  -> OSRM com fallback
```

## 3. Navegação e telas

Tabs atuais em `src/navigation/AppNavigator.tsx`:

- `Inicio`
- `Coleta`
- `Historico`
- `Rotas`
- `Perfil`

### 3.1 Início

Responsabilidades:

- carregar resumo diário
- carregar resumo semanal
- exibir cards por material
- abrir atalhos para `Coleta`, `Rotas` e `Historico`

Fonte atual dos dados:

- SQLite local via `useCollectionsStore`

### 3.2 Coleta

Responsabilidades:

- escolher material
- escolher faixa de peso
- confirmar registro
- solicitar localização
- salvar localmente
- disparar sync best-effort

### 3.3 Histórico

Responsabilidades:

- listar coletas recentes
- filtrar por material
- excluir coleta local
- reprocessar estado de dashboard

### 3.4 Rotas

Responsabilidades:

- carregar localização atual quando disponível
- buscar pontos próximos
- planejar rota via backend quando disponível
- abrir navegação externa no Google Maps

### 3.5 Perfil

Responsabilidades:

- meta diária local
- resumo semanal
- inspeção do banco local
- leitura de health do backend

## 4. Persistência local

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

### Estratégia atual

1. coleta é salva primeiro no SQLite
2. uma entrada é criada em `sync_queue`
3. `collectionsSyncService` tenta drenar a fila
4. falhas remotas não bloqueiam a UX

### Operações de fila

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

### Endpoints

- `GET /health`
- `POST /v1/collections/sync`
- `GET /v1/collections`
- `DELETE /v1/collections/:remoteId`
- `GET /v1/collection-points/nearby`
- `POST /v1/routes/plan`
- `GET /v1/analytics/daily-summary`
- `GET /v1/analytics/weekly-summary`

### Persistência do backend

PostgreSQL atual:

- `collections`
- `route_runs`

Seeds ainda em memória:

- pontos de coleta base

## 7. Planejamento de rotas

Backend:

- usa OSRM quando disponível
- faz fallback para `provider: "none"` se houver falha

Cliente:

- consome rota planejada
- exibe resumo de distância/duração
- permite abrir Google Maps com destino selecionado

## 8. Analytics

### Atual no cliente

- dashboard principal ainda é carregado do SQLite local
- perfil também usa leitura local

### Atual no backend

- existem endpoints para resumo diário e semanal
- o backend já persiste coleções e calcula agregações

### Gap conhecido

- ainda há inconsistências observadas entre `sync`, `GET /collections` e analytics
- por isso o backend ainda não pode ser tratado como fonte canônica estável

## 9. Configuração e segurança

### Arquivos de ambiente

- `.env.example` versionado
- `.env` apenas local

Variáveis relevantes:

- `EXPO_PUBLIC_API_BASE_URL`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT`
- `POSTGRES_HOST`
- `DATABASE_URL`

### Regras

- não versionar `.env`
- não versionar bancos locais
- não hardcodar credenciais reais em código ou docs

## 10. Docker e infraestrutura

Arquivo principal:

- `docker-compose.yml`

Serviços:

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
```

### Validação

```powershell
npm run typecheck
npm run test:run
```

## 12. Testes atuais

Cobertura existente em alto nível:

- validação de coleta
- repositório de coletas
- pontos de rota
- pontos de coleta
- sync de pontos de reciclagem
- store de coletas
- utilitários de mapas

## 13. Limitações e débitos técnicos conhecidos

- lógica de `sync`, `list` e `analytics` no backend ainda precisa revisão
- exclusão remota ainda não está pronta como tombstone distribuído robusto
- autenticação ainda não existe
- observabilidade estruturada ainda não existe
- pontos de coleta do backend ainda dependem parcialmente de seeds

## 14. Próximas correções prioritárias

1. estabilizar backend de coleções
2. alinhar sync com listagem e analytics
3. revisar identidade remota e exclusão
4. mover consumo de analytics do cliente para a API
5. adicionar autenticação e observabilidade
