import {
  createTodo,
  listTodos,
  findTodoById,
  updateTodo,
  deleteTodo,
  markTodoAsDone,
} from '../repositories/todoRepository.js';

export function store(req, res) {
  const todo = createTodo(req.body);
  res.status(201).json(todo);
}

export function index(req, res) {
  const { q, prioridade, page, pageSize, concluido } = req.query;

  const filtros = { q, prioridade, page, pageSize };

  if (concluido !== undefined) {
    filtros.concluido = concluido;
  }

  const resultado = listTodos(filtros);
  res.json(resultado);
}

export function update(req, res) {
  const { id } = req.params;
  const todo = updateTodo(id, req.body);

  if (!todo) {
    return res.status(404).json({ erro: 'Tarefa não encontrada.' });
  }

  return res.json(todo);
}

export function destroy(req, res) {
  const { id } = req.params;
  const deleted = deleteTodo(id);

  if (!deleted) {
    return res.status(404).json({ erro: 'Tarefa não encontrada.' });
  }

  return res.json(deleted);
}

export function conclude(req, res) {
  const { id } = req.params;
  const todo = findTodoById(id);

  if (!todo) {
    return res.status(404).json({ erro: 'Tarefa não encontrada.' });
  }

  if (todo.concluido) {
    return res.status(409).json({ erro: 'A tarefa já está concluída.' });
  }

  const concluded = markTodoAsDone(id);
  return res.json(concluded);
}
