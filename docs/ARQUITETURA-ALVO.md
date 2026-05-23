# Arquitetura Alvo - RecolheTudo

Data: 13-05-2026
Status: recomendacao tecnica para evolucao do MVP offline-first

## 1. Estado Atual

Hoje o projeto funciona assim:

- Frontend React Native / Expo
- Estado local com Zustand
- Persistencia local com SQLite
- Integracoes externas chamadas diretamente pelo app:
  - Overpass para pontos de reciclagem
  - OSRM para roteirizacao

Fluxo atual:

```text
UI -> Store -> Service -> Repository -> SQLite local
UI/Service -> APIs externas publicas
```

Isso e adequado para MVP e prototipacao offline-first, mas nao e a melhor forma para escalar.

## 2. Problema de Escalabilidade

Se o app crescer mantendo chamadas diretas do cliente para provedores externos, os riscos aumentam:

- chaves e configuracoes ficam expostas no cliente quando usar provedores privados
- comportamento inconsistente entre usuarios por dependencia de rede local
- dificuldade para controlar rate limit, fallback e observabilidade
- analytics e historico ficam fragmentados entre dispositivo local e servicos externos
- multiplos dispositivos por usuario ficam sem sincronizacao forte

## 3. Decisao Recomendada

O backend nao deve ser apenas um endpoint de sync.

Minha recomendacao e:

- backend deve ser dono de `sync/API`
- backend deve ser dono de `rotas`
- backend deve ser dono de `analytics`

Ou seja: o app continua offline-first, mas o backend vira a fonte central de consolidacao, sincronizacao e inteligencia.

## 4. Papel de Cada Camada

### App cliente

Responsavel por:

- UX
- captura rapida de coleta
- cache local
- funcionamento offline
- fila de sincronizacao

Nao deve ser responsavel por:

- regras centrais de analytics
- integracao final com provedores externos de rota em producao
- consolidacao global de historico

### Backend proprio

Responsavel por:

- autenticacao e identidade
- API de sincronizacao de coletas
- API de pontos de coleta
- planejamento de rotas
- agregacoes analiticas
- auditoria e observabilidade
- controle de integracoes externas

## 5. Arquitetura Sugerida

```text
Mobile/Web App
  -> Sync API
  -> Route API
  -> Analytics API

Backend
  -> Banco transacional principal
  -> Fila / jobs
  -> Cache
  -> Integradores externos (Mapbox / Google / OSM / OSRM self-hosted)

Cliente
  -> SQLite local
  -> fila de acoes offline
```

## 6. Modulos Recomendados no Backend

### 6.1 Sync API

Endpoints:

- `POST /collections/sync`
- `GET /collections`
- `GET /collections/history`
- `DELETE /collections/:id`

Responsabilidade:

- receber eventos do cliente
- reconciliar conflitos
- responder com estado consolidado

### 6.2 Route API

Endpoints:

- `POST /routes/plan`
- `GET /collection-points/nearby`

Responsabilidade:

- consultar provedores de rota
- aplicar heuristicas de prioridade
- devolver ordem ideal, distancia, duracao e geometria

### 6.3 Analytics API

Endpoints:

- `GET /analytics/daily-summary`
- `GET /analytics/weekly-summary`
- `GET /analytics/profile`

Responsabilidade:

- consolidar totais
- calcular indicadores historicos
- manter resposta consistente entre dispositivos

## 7. Banco de Dados Alvo

### No cliente

- SQLite continua existindo
- papel: cache operacional e fila offline

### No backend

Banco transacional principal, por exemplo:

- PostgreSQL

Tabelas principais sugeridas:

- `users`
- `devices`
- `collections`
- `collection_points`
- `routes`
- `route_runs`
- `sync_events`

## 8. Estrategia de Sincronizacao

Modelo recomendado:

- cada coleta criada localmente recebe `local_id`
- cliente salva `sync_status`
- cliente envia lote de alteracoes quando online
- backend responde com ids canonicos e timestamps de reconciliacao

Campos recomendados:

- `local_id`
- `remote_id`
- `updated_at`
- `deleted_at`
- `sync_status`
- `last_synced_at`

## 9. Roteirizacao em Producao

Minha recomendacao:

- no MVP: OSRM pode continuar como fallback tecnico
- em producao: mover roteirizacao para o backend

Opcoes:

- Mapbox Directions API
- Google Routes API
- OSRM self-hosted

Melhor caminho:

- backend consome o provedor
- cliente recebe apenas resultado consolidado

## 10. Analytics em Producao

Analytics tambem devem sair do cliente.

Razao:

- cliente tem visao parcial
- multiplos dispositivos quebram consistencia
- relatórios e metas ficam mais confiaveis no backend

## 11. Roadmap de Evolucao

### Fase 1

- manter SQLite local
- adicionar painel de inspecao
- adicionar testes de exclusao e historico

### Fase 2

- criar backend de sync
- mover CRUD canonico de coletas para API

### Fase 3

- mover rotas para backend
- centralizar pontos proximos e heuristicas

### Fase 4

- mover analytics para backend
- adicionar dashboards e exportacao

## 12. Conclusao

Decisao recomendada:

- backend nao deve ser so sync/API
- backend deve ser o dono de sync, rotas e analytics

O cliente continua forte em UX offline-first.
O backend vira a camada de verdade operacional e escalabilidade.
