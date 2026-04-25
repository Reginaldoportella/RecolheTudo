# PRD - RecolheTudo

## 1. Visao do Produto

RecolheTudo e um aplicativo mobile para catadores e equipes de coleta de reciclaveis, focado em registro rapido de coletas, rastreio geolocalizado, acompanhamento diario e organizacao de rotas.

## 2. Problema

Catadores normalmente registram coletas de forma manual (caderno, memoria ou mensagens), o que gera:

- baixa rastreabilidade de onde e quando houve coleta;
- dificuldade para analisar produtividade diaria/semanal;
- pouca previsibilidade para montar rotas mais eficientes;
- perda de historico para negociacao com compradores e parceiros.

## 3. Objetivos do Produto

- Reduzir o tempo de registro de cada coleta para menos de 30 segundos.
- Garantir rastreio minimo de material, peso estimado, local e horario.
- Exibir resumo diario por tipo de material e total coletado.
- Preparar base para recomendacao de rota e historico de produtividade.

## 4. Publico-Alvo

- Catadores autonomos.
- Cooperativas de reciclagem de pequeno e medio porte.
- Lideres de equipe que acompanham metas de coleta.

## 5. Escopo Atual (MVP no codigo)

- Navegacao por abas: Inicio, Coleta, Rotas, Perfil.
- Tela Inicio com resumo diario (dados mockados) e atalhos de acao.
- Fluxo de Coleta em 3 etapas:
  1. selecionar material;
  2. selecionar faixa de peso;
  3. confirmar coleta com geolocalizacao.
- Confirmacao via alerta apos registro.

## 6. Escopo da Proxima Entrega (MVP+)

- Persistencia local (SQLite) para salvar coletas reais.
- Dashboard da Inicio consumindo dados reais (nao mock).
- Lista de historico de coletas por dia/material.
- Estrutura inicial de pontos de coleta para futura rota otimizada.
- Perfil com metas simples (kg/dia) e progresso.

## 7. Fora de Escopo (agora)

- Multiusuario com autenticacao online.
- Sincronizacao em nuvem em tempo real.
- Pagamentos, marketplace ou vendas.
- Algoritmo avancado de roteirizacao com transito em tempo real.

## 8. Requisitos Funcionais

- RF01: Usuario deve registrar uma coleta com material, peso estimado, coordenadas e timestamp.
- RF02: Sistema deve validar permissao de localizacao antes de concluir registro.
- RF03: Sistema deve permitir cancelar fluxo de coleta a qualquer etapa.
- RF04: Tela Inicio deve mostrar total coletado e distribuicao por material no dia.
- RF05: Usuario deve visualizar historico local de coletas.
- RF06: Usuario deve acessar aba de rotas com pontos e sugestao de trajeto (fase seguinte).
- RF07: Usuario deve acessar aba de perfil com metas e indicadores basicos.

## 9. Requisitos Nao Funcionais

- RNF01: Aplicativo deve funcionar offline para cadastro e consulta local.
- RNF02: Interface deve ser legivel em telas pequenas (>= 5").
- RNF03: Tempo medio para abrir app < 3s em aparelho intermediario.
- RNF04: Acoes principais devem exigir no maximo 3 toques apos abrir o app.
- RNF05: Armazenamento local deve ser resiliente a encerramento abrupto.

## 10. Metricas de Sucesso

- Taxa de coletas registradas por usuario ativo por dia.
- Tempo medio de registro por coleta.
- Percentual de coletas com localizacao valida.
- Retencao D7 e D30.
- Variacao de kg coletado por semana apos uso continuo.

## 11. Riscos

- Negacao frequente de permissao de localizacao prejudica rastreio.
- Uso apenas de peso estimado pode reduzir confiabilidade dos dados.
- Sem backup em nuvem, perda do aparelho implica perda de historico.

## 12. Roadmap Sugerido

- Sprint 1: Persistencia SQLite + historico local.
- Sprint 2: Dashboard real na Inicio + metrica semanal.
- Sprint 3: Rotas com mapa e pontos cadastrados.
- Sprint 4: Perfil com metas e exportacao basica de dados.
