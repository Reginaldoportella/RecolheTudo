# PRD - RecolheTudo

Data: 17-05-2026  
Status: atualizado para refletir o código atual

## 1. Visão do produto

RecolheTudo é um aplicativo para catadores e equipes de coleta registrarem materiais recicláveis com rapidez, operar offline e evoluir para uma camada centralizada de sincronização, rotas e analytics.

## 2. Problema

Hoje muitos operadores ainda dependem de:

- anotações em papel
- memória
- mensagens soltas

Isso causa:

- baixa rastreabilidade de local, horário e material
- pouca visibilidade de produtividade diária e semanal
- dificuldade para repetir rotas boas
- histórico frágil para prestação de contas e negociação

## 3. Objetivos do produto

- registrar uma coleta em poucos toques
- manter o app útil mesmo sem internet
- consolidar resumo diário e histórico local
- apoiar descoberta de pontos próximos e planejamento de rotas
- preparar sincronização com backend sem bloquear a UX

## 4. Público-alvo

- catadores autônomos
- pequenas cooperativas
- líderes operacionais com necessidade de meta e histórico

## 5. Escopo atual no código

### Cliente

- navegação por abas: `Inicio`, `Coleta`, `Historico`, `Rotas`, `Perfil`
- persistência local em SQLite
- store com Zustand
- registro de coleta com geolocalização quando disponível
- histórico local com filtro por material
- tela de rotas com pontos próximos e rota sugerida
- tela de perfil com meta diária e inspeção de armazenamento

### Backend

- health check
- sync inicial de coleções
- listagem de coleções
- exclusão remota
- pontos próximos
- planejamento de rotas
- analytics diário e semanal

## 6. Benefício principal do MVP atual

O valor do produto hoje está em:

- capturar operação no momento em que ela acontece
- não depender totalmente de rede
- dar ao usuário percepção rápida de volume coletado
- preparar uma transição gradual para backend-first

## 7. Requisitos funcionais atuais

- RF01: registrar coleta com material, peso, data e coordenadas quando disponíveis
- RF02: permitir operação offline com SQLite local
- RF03: mostrar resumo diário e semanal no cliente
- RF04: mostrar histórico local com exclusão
- RF05: consultar pontos próximos com fallback local
- RF06: planejar rota via backend quando disponível
- RF07: manter fila local de sync best-effort
- RF08: permitir inspeção do banco local e do health do backend

## 8. Requisitos não funcionais

- RNF01: app deve continuar útil sem internet
- RNF02: registrar coleta sem travar a UX por falha de backend
- RNF03: backend e cliente devem poder rodar separados em desenvolvimento
- RNF04: configuração sensível não deve ficar hardcoded no repositório
- RNF05: fluxo de desenvolvimento deve funcionar com Expo local e Docker

## 9. Escopo de backend atual

O backend já foi introduzido para assumir gradualmente:

- sincronização de coletas
- pontos de coleta próximos
- planejamento de rota
- analytics

Mas ainda não deve ser tratado como camada pronta para produção.

## 10. Fora de escopo agora

- autenticação completa
- multiusuário consolidado
- reconciliação avançada de conflitos
- observabilidade completa
- roteirização com trânsito em tempo real
- sincronização perfeita entre múltiplos dispositivos

## 11. Estado de sync e SQLite

Hoje o cliente já persiste:

- `remote_id`
- `sync_status`
- `last_synced_at`
- `sync_queue`

Fluxo atual:

1. coleta salva primeiro no SQLite
2. entrada é colocada na fila local
3. backend é chamado em modo best-effort
4. UX não é bloqueada por falha remota

## 12. Principais riscos atuais

- inconsistência na lógica atual de `sync`, `list` e `analytics` no backend
- ausência de autenticação
- ausência de observabilidade estruturada
- risco de colisão de identidade remota em múltiplos dispositivos se o desenho de sync não for refinado

## 13. Critérios para próxima fase

- backend deve persistir corretamente e responder de forma consistente entre sync, listagem e analytics
- soft delete e reconciliação devem ser tratados de forma canônica
- cliente deve conseguir atualizar status local de sync com mais previsibilidade
- documentação e setup de ambiente devem continuar sem expor credenciais

## 14. Roadmap sugerido

### Fase 1

- estabilizar sync/list/analytics do backend
- revisar tombstones de exclusão
- corrigir identidade remota

### Fase 2

- mover consumo de analytics do cliente para a API
- reduzir duplicação entre lógica local e remota

### Fase 3

- autenticação
- observabilidade
- política de retry e reconciliação robusta

### Fase 4

- multi-device confiável
- dashboards e exportação
