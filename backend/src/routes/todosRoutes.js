import { Router } from 'express';
import {
  createTodoValidator,
  concludeTodoValidator,
  deleteTodoValidator,
  listTodosValidator,
  updateTodoValidator,
} from '../validators/todoValidators.js';
import {
  conclude,
  destroy,
  index,
  store,
  update,
} from '../controllers/todosController.js';

const router = Router();

router.get('/', listTodosValidator, index);
router.post('/', createTodoValidator, store);
router.patch('/:id', updateTodoValidator, update);
router.patch('/:id/concluir', concludeTodoValidator, conclude);
router.delete('/:id', deleteTodoValidator, destroy);

export default router;
