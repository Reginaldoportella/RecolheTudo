# Security Checklist - RecolheTudo

Checklist minimo antes de publicar o repositorio no GitHub:

- confirmar que `.env` nao esta rastreado pelo Git
- confirmar que apenas `.env.example` esta versionado
- revisar `docker-compose.yml` para garantir que nao existem senhas em claro
- revisar `backend/src/config/env.mjs` para garantir leitura por variaveis de ambiente
- confirmar que arquivos `.db`, `.sqlite`, logs, caches e dumps nao entram no commit
- confirmar que URLs publicas do frontend nao expõem segredos
- confirmar que nenhum token, chave privada ou credencial aparece em `docs/`, `src/` ou `backend/`

Comandos uteis:

```bash
git status --short
git diff -- .gitignore docker-compose.yml README.md docs/BACKEND.md docs/SECURITY.md backend/src/config/env.mjs
rg -n "(password|secret|token|apikey|api_key|DATABASE_URL|POSTGRES_|BEGIN PRIVATE|ghp_|sk-)" .
```
