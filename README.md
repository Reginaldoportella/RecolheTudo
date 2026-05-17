# RecolheTudo

Aplicativo Expo/React Native para registro de coletas de recicláveis com foco em operação offline-first, persistência local em SQLite e evolução gradual para backend centralizado.

## Visão geral

O projeto hoje combina duas camadas:

- cliente mobile/web em Expo
- backend HTTP Node em `backend/` com PostgreSQL

O app continua operando com SQLite local como fonte operacional imediata. Quando o backend está disponível, ele passa a apoiar sincronização, pontos próximos, planejamento de rotas e inspeção de saúde.

## Estado atual

### Frontend e telas

- `Inicio`: resumo diário e semanal, atalhos de ação e estados de UX
- `Coleta`: fluxo guiado para registrar material, peso e localização
- `Historico`: lista de coletas com filtro por material e exclusão local
- `Rotas`: mapa com pontos próximos, rota sugerida e abertura no Google Maps
- `Perfil`: meta diária, resumo semanal e inspeção do banco local e do backend

### Sync e SQLite

- SQLite local em `src/data/database.ts`
- coletas persistem `remote_id`, `sync_status` e `last_synced_at`
- fila local `sync_queue` para operações pendentes
- sincronização atual é best-effort

### Backend

Endpoints já implementados:

- `GET /health`
- `POST /v1/collections/sync`
- `GET /v1/collections`
- `DELETE /v1/collections/:remoteId`
- `GET /v1/collection-points/nearby`
- `POST /v1/routes/plan`
- `GET /v1/analytics/daily-summary`
- `GET /v1/analytics/weekly-summary`

### Docker e infraestrutura

- `docker-compose.yml` sobe `postgres`, `backend` e `dev`
- `backend/` usa PostgreSQL via variáveis de ambiente
- o repositório versiona apenas `.env.example`

## Estrutura principal

```text
RecolheTudo/
├── backend/                  # API HTTP Node + PostgreSQL
├── docs/                     # PRD, SPEC, arquitetura e segurança
├── src/
│   ├── components/           # componentes visuais
│   ├── config/               # config pública do app
│   ├── data/                 # SQLite e repositórios locais
│   ├── domain/               # tipos e erros
│   ├── modules/              # casos de uso de rotas
│   ├── navigation/           # tabs e tipos de navegação
│   ├── screens/              # telas principais
│   ├── services/             # integração backend/local
│   ├── state/                # stores Zustand
│   └── utils/                # helpers
├── .env.example              # placeholders seguros
├── docker-compose.yml
└── package.json
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker Desktop, se quiser testar com containers
- Expo Go no celular

Importante:

- use `npx expo ...`
- não use o `expo-cli` global legado

## Configuração de ambiente

O repositório não deve versionar `.env`.

1. Crie seu arquivo local a partir de `.env.example`
2. Preencha apenas valores locais de desenvolvimento

Exemplo de variáveis usadas no projeto:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
POSTGRES_DB=recolhetudo
POSTGRES_USER=postgres
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_PORT=5432
```

## Rodando o app localmente

### App Expo

PowerShell:

```powershell
npm install
npx expo start
```

Para abrir no navegador:

```powershell
npm run web
```

### Backend local

PowerShell:

```powershell
npm run backend:dev
```

### PostgreSQL com Docker

PowerShell:

```powershell
docker-compose up postgres
```

## Rodando tudo com Docker

PowerShell:

```powershell
docker-compose up postgres backend dev
```

URLs esperadas:

- frontend web: [http://localhost:8081](http://localhost:8081)
- backend health: [http://localhost:3001/health](http://localhost:3001/health)
- PostgreSQL: `localhost:5432`

## Como abrir no celular com Expo Go

### Opção recomendada: mesma rede Wi‑Fi

1. Instale o Expo Go no celular
2. Conecte computador e celular na mesma rede
3. Rode:

```powershell
npx expo start
```

4. Abra o Expo Go
5. Escaneie o QR Code mostrado no terminal ou no navegador do Expo

### Se a rede local bloquear descoberta

Use tunnel:

```powershell
npx expo start --tunnel
```

Observações:

- o app no celular só consegue chamar `http://localhost:3001` se essa URL fizer sentido para o dispositivo
- para teste real no celular, normalmente você precisará usar o IP da máquina no `EXPO_PUBLIC_API_BASE_URL`
- para web local no navegador do computador, `http://localhost:3001` funciona normalmente

## Scripts disponíveis

| Script | Comando | Uso |
|---|---|---|
| `start` | `expo start` | inicia o Metro |
| `web` | `expo start --web` | abre a versão web |
| `android` | `expo start --android` | abre no Android |
| `ios` | `expo start --ios` | abre no iOS |
| `typecheck` | `tsc --noEmit` | checagem de tipos |
| `test` | `jest` | testes |
| `test:run` | `jest --runInBand --no-coverage` | testes sem watch |
| `backend:start` | `npm --prefix backend run start` | sobe backend |
| `backend:dev` | `npm --prefix backend run dev` | backend em watch |
| `backend:check` | `npm --prefix backend run check` | sintaxe do backend |
| `docker:dev` | `docker-compose up dev` | frontend em container |
| `docker:test` | `docker-compose run --rm test` | typecheck + testes |
| `docker:clean` | `docker-compose down -v` | limpa containers/volumes |

## Segurança do repositório

- não comite `.env`
- não comite `.db`, `.sqlite`, logs, dumps ou caches
- mantenha senhas e credenciais apenas em variáveis locais
- publique apenas `.env.example` com placeholders

Checklist adicional em:

- [docs/SECURITY.md](C:/Users/User/Documents/RecolheTudo/docs/SECURITY.md)

## Documentação complementar

- [docs/PRD.md](C:/Users/User/Documents/RecolheTudo/docs/PRD.md)
- [docs/SPEC.md](C:/Users/User/Documents/RecolheTudo/docs/SPEC.md)
- [docs/BACKEND.md](C:/Users/User/Documents/RecolheTudo/docs/BACKEND.md)
- [docs/ARQUITETURA-ALVO.md](C:/Users/User/Documents/RecolheTudo/docs/ARQUITETURA-ALVO.md)

## Qualidade e validação

Comandos usados para validar o projeto:

```powershell
npm run typecheck
npm run test:run
npm run backend:check
```

## Limitações conhecidas

O projeto está funcional para desenvolvimento, mas ainda há pontos em revisão antes de ser tratado como backend de produção:

- inconsistências na lógica de sync/list/analytics do backend
- ausência de autenticação
- ausência de observabilidade estruturada
- reconcilição de conflitos ainda incompleta
