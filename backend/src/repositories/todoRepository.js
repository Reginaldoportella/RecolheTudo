import { randomUUID } from 'crypto';

const todos = new Map();

export function createTodo({ nome, descricao, prioridade, etiquetas, prazo }) {
  const now = new Date();
  const todo = {
    id: randomUUID(),
    nome,
    descricao,
    prioridade,
    etiquetas: [...etiquetas],
    prazo: prazo ? new Date(prazo).toISOString() : null,
    concluido: false,
    criadoEm: now.toISOString(),
    atualizadoEm: now.toISOString(),
  };

  todos.set(todo.id, todo);
  return todo;
}

export function listTodos({ q, concluido, prioridade, page, pageSize }) {
  const values = Array.from(todos.values());
  const currentPage = Number(page) || 1;
  const size = Number(pageSize) || 10;

  let filtered = values;

  if (typeof concluido === 'boolean') {
    filtered = filtered.filter((todo) => todo.concluido === concluido);
  }

  if (prioridade) {
    filtered = filtered.filter((todo) => todo.prioridade === prioridade);
  }

  if (q) {
    const term = q.toLowerCase();
    filtered = filtered.filter(
      (todo) =>
        todo.nome.toLowerCase().includes(term) ||
        todo.descricao.toLowerCase().includes(term)
    );
  }

  const total = filtered.length;
  const start = (currentPage - 1) * size;
  const end = start + size;
  const items = filtered.slice(start, end);

  return {
    items,
    total,
    page: currentPage,
    pageSize: size,
    totalPages: Math.max(Math.ceil(total / size), 1),
  };
}

export function findTodoById(id) {
  return todos.get(id) || null;
}

export function updateTodo(id, changes) {
  const existing = todos.get(id);

  if (!existing) {
    return null;
  }

  const concluidoAtualizado =
    changes.concluido === undefined ? existing.concluido : changes.concluido;

  const updated = {
    ...existing,
    ...changes,
    concluido: concluidoAtualizado,
    etiquetas:
      changes.etiquetas === undefined
        ? existing.etiquetas
        : [...changes.etiquetas],
    concluidoEm:
      changes.concluidoEm ??
      (concluidoAtualizado ? existing.concluidoEm || new Date().toISOString() : null),
    prazo:
      changes.prazo === undefined
        ? existing.prazo
        : changes.prazo
        ? new Date(changes.prazo).toISOString()
        : null,
    atualizadoEm: new Date().toISOString(),
  };

  todos.set(id, updated);
  return updated;
}

export function deleteTodo(id) {
  const existing = todos.get(id);

  if (!existing) {
    return null;
  }

  todos.delete(id);
  return existing;
}

export function markTodoAsDone(id) {
  return updateTodo(id, { concluido: true, concluidoEm: new Date().toISOString() });
}
