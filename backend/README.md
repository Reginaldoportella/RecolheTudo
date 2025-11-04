# API de To-do List

API REST gratuita construída com Node.js e Express para gerenciar tarefas.

## Recursos

- Criar tarefas com nome, descrição, prioridade, etiquetas e prazo opcional.
- Listar tarefas com filtros por texto, conclusão e prioridade, incluindo paginação.
- Atualizar qualquer campo da tarefa.
- Marcar tarefas como concluídas com controle de conflitos.
- Remover tarefas.
- Middleware de validação com Joi e tratamento centralizado de erros.
- Observabilidade básica com logs HTTP (morgan) e endpoint de health check.

## Como executar

```bash
cd backend
npm install
npm run dev
```

A API ficará disponível em `http://localhost:3000`.

## Rotas principais

- `GET /health`: Verificação de status da aplicação.
- `POST /todos`: Cria uma nova tarefa.
- `GET /todos`: Lista tarefas com filtros `q`, `concluido`, `prioridade`, `page` e `pageSize`.
- `PATCH /todos/:id`: Atualiza campos de uma tarefa.
- `PATCH /todos/:id/concluir`: Marca a tarefa como concluída.
- `DELETE /todos/:id`: Remove uma tarefa.

## Próximos passos sugeridos

- Substituir o repositório em memória por um banco de dados gratuito como SQLite ou PostgreSQL (via Supabase). 
- Adicionar autenticação gratuita com Firebase Auth ou Auth.js usando provedores sociais.
- Configurar deploy em plataformas gratuitas como Render, Railway ou Fly.io.
