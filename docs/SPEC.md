# SPEC Tecnica - RecolheTudo

Versao: 2.0 (evoluida para desenvolvimento real)
Data: 25-04-2026
Status: pronta para execucao por squads mobile

## 1. Stack

- Runtime: React Native 0.79 + Expo SDK 53
- Linguagem alvo: TypeScript (migracao progressiva de JS para TS)
- Navegacao: @react-navigation/native + bottom-tabs
- Persistencia offline: expo-sqlite
- Geolocalizacao: expo-location
- Mapa: react-native-maps
- Estado global: Zustand
- Testes: Jest + React Native Testing Library
- Qualidade: ESLint + TypeScript strict + Prettier

Diretrizes de compilacao TS:

- strict: true
- noImplicitAny: true
- exactOptionalPropertyTypes: true
- noUncheckedIndexedAccess: true
- skipLibCheck: false (preferencial)

## 2. Estrutura Atual

- App.js: bootstrap do app e StatusBar.
- src/navigation/AppNavigator.js: abas principais.
- src/screens:
  - HomeScreen.js
  - CollectionScreen.js
  - RoutesScreen.js (placeholder)
  - ProfileScreen.js (placeholder)
- src/components/MaterialButton.js
- src/styles/globalStyles.js
- src/styles/colors.js

Evolucao de estrutura proposta (mantendo base atual):

```text
src/
  app/
    providers/
      StoreProvider.tsx
  components/
    MaterialButton.tsx
  data/
    database.ts
    migrations/
      001_create_collections.sql
      002_create_route_points.sql
    repositories/
      collectionsRepository.ts
      routePointsRepository.ts
  domain/
    types/
      collection.ts
      metrics.ts
      route.ts
    errors/
      appError.ts
      validationError.ts
  navigation/
    AppNavigator.tsx
  screens/
    HomeScreen.tsx
    CollectionScreen.tsx
    HistoryScreen.tsx
    RoutesScreen.tsx
    ProfileScreen.tsx
  services/
    collectionService.ts
    locationService.ts
    metricsService.ts
    routesService.ts
  state/
    useCollectionsStore.ts
    selectors/
      collectionsSelectors.ts
  validation/
    collectionValidation.ts
    schemas.ts
  utils/
    date.ts
    number.ts
    logger.ts
```

Responsabilidade por camada:

- Screen: renderizacao e interacao, sem regra de negocio.
- Store: estado, orquestracao de casos de uso e cache.
- Service: fluxo de negocio e composicao de repositorios.
- Repository: acesso a dados (SQLite) apenas.
- Validation: validacao de entrada e normalizacao.

## 3. Arquitetura Proposta (proxima fase)

Padrao arquitetural recomendado: Clean-ish modular (UI -> Store -> Service -> Repository -> DB).

Regras de acoplamento:

- UI nao acessa repository diretamente.
- Store nao executa SQL diretamente.
- Service nao conhece componentes de UI.
- Repository recebe apenas payload validado.

Fluxo padrao de comando (write):

1. Screen dispara action da store.
2. Store chama service.
3. Service valida input e consulta locationService (quando necessario).
4. Service chama repository para persistir.
5. Store invalida cache e atualiza estado observavel.

Fluxo padrao de consulta (read):

1. Screen solicita dados via store.
2. Store atende por cache por data quando valido.
3. Em cache miss/invalidacao, store chama service.
4. Service agrega dados de repository e retorna DTO tipado.

## 4. Modelo de Dados

### 4.1 Tabela principal: collections

- id: INTEGER PRIMARY KEY AUTOINCREMENT
- material: TEXT NOT NULL CHECK(material IN ('papel','plastico','metal','vidro','outros'))
- weight_kg: REAL NOT NULL CHECK(weight_kg > 0)
- latitude: REAL NULL
- longitude: REAL NULL
- created_at: TEXT NOT NULL
- notes: TEXT NULL

Indices:

- idx_collections_created_at (created_at)
- idx_collections_material_created (material, created_at)

### 4.2 Tabela para pontos de coleta (rotas)

- id: INTEGER PRIMARY KEY AUTOINCREMENT
- name: TEXT NOT NULL
- latitude: REAL NOT NULL
- longitude: REAL NOT NULL
- material_preference: TEXT NULL
- last_collected_at: TEXT NULL
- priority: INTEGER NOT NULL DEFAULT 0
- created_at: TEXT NOT NULL

Indices:

- idx_route_points_priority (priority)
- idx_route_points_material_pref (material_preference)

### 4.3 Versao de schema

- tabela schema_version(version INTEGER NOT NULL)
- migracoes idempotentes por arquivo incremental

## 5. Fluxos Tecnicos

### 5.1 Registrar coleta

1. Usuario escolhe material.
2. Usuario escolhe faixa de peso ou valor direto.
3. Screen envia CollectionInput para store.
4. Store chama collectionService.createCollection.
5. Validation layer executa validateCollection.
6. App solicita permissao de localizacao (quando habilitado).
7. Captura coordenadas (fallback para null permitido e rastreado).
8. Repository persiste em transacao SQLite.
9. Store invalida cache da data e recarrega resumo do dia.
10. UI exibe sucesso ou erro com feedback explicito.

### 5.2 Carregar dashboard da Inicio

1. Store resolve chave de cache por data local (YYYY-MM-DD).
2. Se cache valido, retorna imediatamente.
3. Se cache invalido, chama metricsService.getDailySummary.
4. MetricsService agrega por material e total.
5. Store publica estado success.

### 5.3 Carregar historico

1. UI requisita pagina inicial (limit 20).
2. Store chama service com pagina/cursor.
3. Repository retorna colecoes ordenadas por created_at DESC.
4. UI trata loading, empty, success e error.

### 5.4 Carregar rotas

1. Store solicita pontos locais do dia.
2. routesService aplica ordenacao simples local (prioridade + distancia linear).
3. UI desenha markers e polyline sem API externa.

## 6. Contratos de Funcoes (sugestao)

### 6.1 Tipos centrais (TypeScript)

```ts
export type Material = "papel" | "plastico" | "metal" | "vidro" | "outros";

export interface Collection {
  id: number;
  material: Material;
  weightKg: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string; // ISO-8601 UTC
  notes?: string | null;
}

export interface CollectionInput {
  material: Material;
  weightKg: number;
  createdAt: string; // ISO-8601 UTC
  notes?: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface SummaryByMaterial {
  papel: number;
  plastico: number;
  metal: number;
  vidro: number;
  outros: number;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  totalKg: number;
  byMaterial: SummaryByMaterial;
  collectionsCount: number;
}

export interface WeeklyMetrics {
  weekStart: string;
  weekEnd: string;
  totalKg: number;
  averageKgPerDay: number;
  topMaterial: Material | null;
}
```

### 6.2 Contratos de repository

```ts
export interface CollectionsRepository {
  insertCollection(input: CollectionInput): Promise<{ id: number }>;
  getCollectionsByDate(date: string): Promise<Collection[]>;
  getRecentCollections(limit: number, offset: number): Promise<Collection[]>;
  getDailySummary(date: string): Promise<DailySummary>;
}
```

### 6.3 Contratos de service

```ts
export interface CollectionService {
  createCollection(input: CollectionInput): Promise<{ id: number }>;
}

export interface MetricsService {
  getDailySummary(date: string): Promise<DailySummary>;
  getWeeklyMetrics(referenceDate: string): Promise<WeeklyMetrics>;
}
```

## 7. Regras de Negocio

- Material obrigatorio e deve pertencer ao union Material.
- Peso deve ser > 0 e <= 1000 por registro (guardrail inicial).
- createdAt obrigatorio no formato ISO-8601 valido.
- Timestamp persistido em UTC.
- Localizacao recomendada, nao obrigatoria.
- Em permissao negada, o app registra sem coordenada e sinaliza status.
- Repository nao deve ser chamado com payload invalido.

## 8. Erros e Observabilidade

### 8.1 Modelo de erro padrao

```ts
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "LOCATION_PERMISSION_DENIED"
  | "LOCATION_UNAVAILABLE"
  | "DATABASE_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
}

export class ValidationError extends Error {
  code: ErrorCode = "VALIDATION_ERROR";
  fields: Record<string, string>;

  constructor(fields: Record<string, string>) {
    super("Dados invalidos para registro de coleta");
    this.fields = fields;
  }
}
```

### 8.2 Logging e telemetria

- Ambiente dev: logger.ts com console estruturado.
- Ambiente prod: adaptador para Sentry/Datadog (futuro).
- Eventos minimos:
  - collection_create_started
  - collection_create_succeeded
  - collection_create_failed
  - location_permission_denied

## 9. Seguranca e Privacidade

- Solicitar localizacao apenas no fluxo de coleta.
- Exibir justificativa de uso no momento da permissao.
- Nao coletar PII desnecessaria.
- Em futuras sincronizacoes, cifrar canal (TLS) e tokenizar identificadores.
- Planejar politica de retencao local (ex.: 12 meses configuravel).

## 10. Performance

- Consultas indexadas por created_at e material.
- Cache em memoria por data no estado global.
- Invalida apenas chaves afetadas apos insert.
- Paginacao para historico (limit/offset ou cursor).
- Memoizacao de seletores no Zustand.
- Renderizacao de listas via FlatList com keyExtractor estavel.

## 11. Plano de Implementacao

Fase A (base de dados e tipagem)

- Migrar para TypeScript com strict mode.
- Criar domain/types com contratos centrais.
- Criar database.ts e migration inicial.
- Implementar collectionsRepository.ts e routePointsRepository.ts.

Fase B (validacao e services)

- Criar pasta validation com validateCollection.
- Implementar ValidationError.
- Implementar collectionService, metricsService e locationService.

Fase C (estado e UI states)

- Implementar useCollectionsStore com Zustand.
- Integrar Home e Collection pela store.
- Implementar HistoryScreen com paginação.
- Definir estados de UX por tela (loading, empty, success, error, permission_denied).

Fase D (mapas e rotas)

- Implementar RoutesScreen com react-native-maps.
- Exibir markers de pontos de coleta.
- Gerar rota simples local (polyline) sem API externa.
- Preparar interface para provider externo (Google Maps/Mapbox).

Fase E (testes e qualidade)

- Configurar Jest + RNTL.
- Cobrir validacao, repository e fluxo de registro.
- Adicionar CI de lint, typecheck e testes.

## 12. Criterios de Aceite (proxima entrega)

- CA01: Registro cria linha em SQLite com material, peso, data e coordenadas (quando permitido).
- CA02: Inicio mostra total e por material com dados reais do dia.
- CA03: Historico lista ao menos as 20 coletas mais recentes.
- CA04: App opera offline em todo fluxo principal.
- CA05: Repository rejeita payload invalido via ValidationError antes do insert.
- CA06: Home, Collection e History implementam todos os UX states definidos.
- CA07: Store faz cache por data e invalida ao inserir coleta.
- CA08: Tela de rotas exibe markers locais e polyline simples.
- CA09: Testes unitarios e de integracao minimos passam em CI.

## 13. Camada de Validacao (nova)

Estrutura:

- src/validation/collectionValidation.ts
- src/validation/schemas.ts

Contrato:

```ts
export function validateCollection(input: CollectionInput): void {
  const errors: Record<string, string> = {};

  if (!input.material) errors.material = "material obrigatorio";
  if (
    !["papel", "plastico", "metal", "vidro", "outros"].includes(input.material)
  ) {
    errors.material = "material invalido";
  }
  if (!(input.weightKg > 0)) errors.weightKg = "weightKg deve ser maior que 0";
  if (!input.createdAt) {
    errors.createdAt = "createdAt obrigatorio";
  } else if (Number.isNaN(Date.parse(input.createdAt))) {
    errors.createdAt = "createdAt deve ser ISO-8601 valido";
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors);
  }
}
```

Regras operacionais:

- Service deve chamar validateCollection antes de repository.
- Repository assume input valido e nao repete regra de dominio.
- Falhas de validacao retornam erro amigavel para UI e erro estruturado para logs.

## 14. Estrategia de Estado com Zustand (nova)

Objetivo: centralizar dados offline, cache por data e orquestracao de fluxos.

Estrutura base do store:

```ts
type UIStatus =
  | "idle"
  | "loading"
  | "empty"
  | "success"
  | "error"
  | "permission_denied";

interface CollectionsStoreState {
  dailySummaryByDate: Record<string, DailySummary>;
  history: Collection[];
  homeStatus: UIStatus;
  collectionStatus: UIStatus;
  historyStatus: UIStatus;
  errorMessage: string | null;

  loadHome(date: string): Promise<void>;
  registerCollection(input: CollectionInput): Promise<void>;
  loadHistory(limit?: number, offset?: number): Promise<void>;
  invalidateDate(date: string): void;
  clearError(): void;
}
```

Politica de cache:

- Chave: data (YYYY-MM-DD).
- TTL inicial: sem expiracao temporal; invalidacao por evento de escrita.
- Invalida ao inserir coleta da mesma data.
- Opcional futuro: invalidacao por versao de schema.

Responsabilidades:

- UI chama apenas a store.
- Store orquestra services.
- Services consomem repository e validacao.

## 15. UX States por Tela (nova)

### 15.1 Home

- loading: skeleton do resumo e botoes desabilitados.
- empty: card com "sem coletas hoje" + CTA "Registrar coleta".
- success: resumo completo por material e total.
- error: mensagem + botao "Tentar novamente".

### 15.2 Collection

- loading: durante confirmacao/salvamento.
- success: feedback de coleta registrada e reset de fluxo.
- error: alerta com causa e acao de retry.
- permission_denied: banner explicando impacto + opcao de continuar sem localizacao.

### 15.3 History

- loading: skeleton/lista shimmer.
- empty: estado vazio com orientacao para primeira coleta.
- success: lista paginada com itens e resumo rapido.
- error: card de erro com retry e preservacao do ultimo cache valido.

Regras de UX resiliente:

- Nenhum erro silencioso.
- Toda falha de operacao critica deve resultar em estado error observavel.
- Estados devem ser rastreaveis por logs.

## 16. Testes Basicos (nova)

### 16.1 Escopo

- Unitarios:
  - validation/collectionValidation
  - repositories/collectionsRepository (com DB de teste)
  - services/collectionService (mocks de dependencia)
- Integracao:
  - fluxo completo de registro de coleta (UI -> store -> service -> repository)
  - fallback de permissao negada de localizacao

### 16.2 Ferramentas

- Jest
- React Native Testing Library
- @testing-library/jest-native

### 16.3 Casos minimos obrigatorios

- Insercao valida:
  - deve persistir e invalidar cache da data.
- Insercao invalida:
  - material invalido deve disparar ValidationError.
  - weightKg <= 0 deve disparar ValidationError.
- Falha de localizacao:
  - permission denied deve seguir fluxo permission_denied e permitir salvar sem coordenada (se regra habilitada).

### 16.4 Exemplo de teste (resumo)

```ts
it("deve rejeitar insercao com weightKg invalido", async () => {
  await expect(
    collectionService.createCollection({
      material: "papel",
      weightKg: 0,
      createdAt: new Date().toISOString(),
    }),
  ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
});
```

## 17. Mapas e Rotas (nova)

Biblioteca:

- react-native-maps para renderizacao de mapa, markers e polyline.

Modelo de dados de rota:

```ts
export interface RoutePoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  priority: number;
  materialPreference?: Material | null;
}

export interface DailyRoute {
  date: string;
  points: RoutePoint[];
  polyline: Array<{ latitude: number; longitude: number }>;
  distanceKmEstimate: number;
}
```

Estrategia inicial (sem API externa):

- Persistir pontos localmente em SQLite.
- Ordenar por prioridade e proximidade aproximada.
- Desenhar markers para pontos.
- Desenhar polyline simples conectando pontos ordenados.

Preparacao para evolucao:

- Criar interface RouteProvider com implementacoes:
  - LocalRouteProvider (atual)
  - GoogleMapsRouteProvider (futuro)
  - MapboxRouteProvider (futuro)

## 18. Padrões de Codigo e Qualidade (nova)

- Proibir any em codigo de dominio e dados.
- Preferir DTOs explicitos entre camadas.
- Funcoes puras para validacao e agregacao.
- Commits pequenos por feature.
- CI minima:
  - npm run lint
  - npm run typecheck
  - npm run test

## 19. Definicao de Pronto (DoD) (nova)

- Feature com tipos TS completos.
- Validacao aplicada no service.
- UX states implementados e testados.
- Testes unitarios e integracao verdes.
- Sem regressao de performance perceptivel.
- Documentacao atualizada na SPEC quando necessario.
