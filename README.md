# RecolheTudo

Aplicativo mobile offline-first para catadores de materiais recicláveis registrarem coletas, acompanharem o progresso diário e visualizarem o histórico de trabalho.

---

## Sumário

- [Visão Geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Stack Técnica](#stack-técnica)
- [Arquitetura](#arquitetura)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Banco de Dados](#banco-de-dados)
- [Testes](#testes)
- [CI/CD](#cicd)
- [Configuração TypeScript](#configuração-typescript)

---

## Visão Geral

O **RecolheTudo** foi projetado para funcionar 100% offline. Todos os dados são persistidos localmente via SQLite (expo-sqlite). A geolocalização é capturada automaticamente no momento do registro e armazenada junto à coleta, permitindo rastrear onde cada material foi coletado.

---

## Funcionalidades

| Tela | Descrição |
|---|---|
| **Início** | Dashboard diário com total coletado em kg, breakdown por material (papel, plástico, metal, vidro, outros) e estados de UX (loading, empty, error com retry) |
| **Coleta** | Fluxo guiado em 3 etapas: escolha do material → estimativa de peso → confirmação com geolocalização automática |
| **Rotas** | Planejamento de rotas de coleta *(em desenvolvimento)* |
| **Perfil** | Dados do catador e configurações *(em desenvolvimento)* |

---

## Stack Técnica

| Camada | Tecnologia | Versão |
|---|---|---|
| Runtime | React Native | 0.79.6 |
| Framework | Expo SDK | ~53.0.27 |
| Linguagem | TypeScript (strict) | ~5.8.3 |
| Banco de dados | expo-sqlite | ~15.2.14 |
| Gerenciamento de estado | Zustand | ^5.0.8 |
| Navegação | React Navigation (bottom-tabs) | ^7.x |
| Geolocalização | expo-location | ~18.1.6 |
| Testes | Jest + jest-expo | ^29.7.0 / ~53.0.9 |

---

## Arquitetura

O projeto segue uma arquitetura em camadas com separação clara de responsabilidades:

```
Telas (screens)
    │
    ▼
Store Zustand (state)        ← orquestração de casos de uso, cache por data
    │
    ├── Validação (validation) ← regras de negócio, lança ValidationError
    │
    └── Repository (data)    ← acesso ao SQLite, sem regra de negócio
            │
            ▼
        Database (data)      ← singleton SQLite com migrações versionadas
```

**Fluxo de registro de coleta:**
1. Tela chama `registerCollection(input)` na store
2. Store solicita permissão de localização → captura coordenadas (com fallback `null`)
3. `validateCollection(input)` é chamado — lança `ValidationError` se inválido
4. `collectionsRepository.insertCollection(input)` persiste no SQLite
5. Cache da data atual é invalidado → `loadHome` recarrega o resumo

---

## Estrutura de Pastas

```
RecolheTudo/
├── App.tsx                        # Entrypoint do app
├── index.js                       # Entrypoint Expo (não migrado para TS por convenção)
├── app.json                       # Configurações Expo (nome, ícone, splash, bundle ID)
├── tsconfig.json                  # TypeScript strict mode
├── jest.config.js                 # Configuração Jest
├── babel.config.js                # Configuração Babel/Expo
├── .github/
│   └── workflows/
│       └── ci.yml                 # Pipeline de CI (typecheck + testes)
├── assets/                        # Ícones e imagens do app
└── src/
    ├── components/
    │   └── MaterialButton.tsx     # Botão colorido por tipo de material
    ├── data/
    │   ├── database.ts            # Singleton SQLite + migrações versionadas
    │   └── repositories/
    │       ├── collectionsRepository.ts
    │       └── __tests__/
    │           └── collectionsRepository.test.ts
    ├── domain/
    │   ├── errors/
    │   │   └── validationError.ts # Classe ValidationError tipada
    │   └── types/
    │       └── collection.ts      # Contratos centrais de domínio
    ├── navigation/
    │   ├── AppNavigator.tsx       # Bottom-tabs tipado
    │   └── types.ts               # RootTabParamList
    ├── screens/
    │   ├── HomeScreen.tsx
    │   ├── CollectionScreen.tsx
    │   ├── RoutesScreen.tsx
    │   └── ProfileScreen.tsx
    ├── state/
    │   └── useCollectionsStore.ts # Store Zustand
    ├── styles/
    │   ├── colors.ts              # Paleta de cores (as const)
    │   └── globalStyles.ts        # StyleSheet global
    ├── types/
    │   └── declarations.d.ts      # Declarações de módulos sem tipos
    └── validation/
        ├── collectionValidation.ts
        └── __tests__/
            └── collectionValidation.test.ts
```

---

## Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [npm](https://www.npmjs.com/) 10+
- `npx expo` (não use o `expo-cli` global legado)
- Para testar no celular: app **Expo Go** ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) / [iOS](https://apps.apple.com/app/expo-go/id982107779))

---

## Instalação

```bash
# Clone o repositório
git clone https://github.com/<seu-usuario>/RecolheTudo.git
cd RecolheTudo

# Configure as variáveis locais
cp .env.example .env

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npx expo start
```

Após iniciar, escaneie o QR code com o Expo Go ou pressione:
- `a` — abrir no emulador Android
- `w` — abrir no navegador (versão web)

---

## Scripts Disponíveis

| Script | Comando | Descrição |
|---|---|---|
| `start` | `expo start` | Inicia o Metro Bundler |
| `android` | `expo start --android` | Abre no Android |
| `ios` | `expo start --ios` | Abre no iOS |
| `web` | `expo start --web` | Abre no navegador |
| `backend:dev` | `npm --prefix backend run dev` | Sobe a API local |
| `typecheck` | `tsc --noEmit` | Verifica erros de tipo sem compilar |
| `test` | `jest` | Executa os testes unitários |

---

## Configuração de Ambiente

O repositório versiona apenas `.env.example`.

Arquivos e credenciais locais ficam em:

- `.env` para desenvolvimento local
- variáveis de ambiente do shell ou do Docker

Antes de publicar no GitHub:

- não comite `.env`
- não comite bancos `.db` ou `.sqlite`
- não comite logs, caches ou dumps
- mantenha senhas e URLs sensíveis fora do código

---

## Banco de Dados

O app utiliza **SQLite local** via `expo-sqlite` com um sistema de **migrações versionadas**.

### Tabelas

**`collections`**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER PK | Identificador único |
| `material` | TEXT | `papel`, `plastico`, `metal`, `vidro`, `outros` |
| `weight_kg` | REAL | Peso estimado em kg |
| `latitude` | REAL (nullable) | Latitude GPS no momento da coleta |
| `longitude` | REAL (nullable) | Longitude GPS no momento da coleta |
| `created_at` | TEXT | Data/hora ISO 8601 |
| `notes` | TEXT (nullable) | Observações livres |

**`schema_version`**

| Coluna | Tipo | Descrição |
|---|---|---|
| `version` | INTEGER | Versão atual do schema |

### Migrações

Cada migração é executada dentro de uma transação (`BEGIN TRANSACTION / ROLLBACK`). Adicionar novas migrações:

```typescript
// src/data/database.ts
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    sql: `CREATE TABLE IF NOT EXISTS collections ( ... )`,
  },
  // Adicione aqui novas migrações incrementais
  {
    version: 2,
    sql: `ALTER TABLE collections ADD COLUMN synced INTEGER DEFAULT 0`,
  },
];
```

---

## Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npx jest --watch

# Executar com cobertura
npx jest --coverage
```

### Suítes existentes

| Arquivo | Casos | O que testa |
|---|---|---|
| `collectionValidation.test.ts` | 5 | Material inválido, peso zero, data inválida, coordenada fora da faixa, caso válido |
| `collectionsRepository.test.ts` | 3 | Insert, getByDate, getDailySummary (banco mockado) |

Os testes do repository utilizam `jest.mock("../../database")` para isolar completamente o SQLite.

---

## CI/CD

O pipeline é executado via **GitHub Actions** em todo `push` para `main` e em Pull Requests.

```
push / PR → Checkout → Node 20 → npm ci → typecheck → testes
```

Arquivo: [.github/workflows/ci.yml](.github/workflows/ci.yml)

A pipeline bloqueia merge se:
- `tsc --noEmit` retornar qualquer erro de tipo
- Qualquer teste falhar

---

## Configuração TypeScript

O projeto usa **TypeScript strict mode** completo com as seguintes flags ativas:

```jsonc
{
  "strict": true,               // habilita todas as verificações strict
  "noImplicitAny": true,        // proíbe any implícito
  "exactOptionalPropertyTypes": true, // distingue prop ausente de prop undefined
  "noUncheckedIndexedAccess": true,   // acesso a array/record retorna T | undefined
  "allowJs": false,             // arquivos .js proibidos no projeto
  "skipLibCheck": true          // necessário no ecossistema Expo/RN
}
```

> **Por que `skipLibCheck: true`?** Dependências do ecossistema React Native/Expo possuem conflitos de versão em seus arquivos `.d.ts` que são inevitáveis e fora do controle do projeto. `skipLibCheck` ignora esses conflitos sem abrir mão do strict mode no código da aplicação.
