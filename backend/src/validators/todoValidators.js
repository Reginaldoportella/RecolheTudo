import Joi from 'joi';
import validate from '../middlewares/validate.js';

const idParam = Joi.string().guid({ version: ['uuidv4'] }).required();

export const createTodoValidator = validate({
  body: Joi.object({
    nome: Joi.string().trim().min(1).max(120).required(),
    descricao: Joi.string().trim().max(500).allow('').default(''),
    prioridade: Joi.string().valid('baixa', 'media', 'alta').default('media'),
    etiquetas: Joi.array().items(Joi.string().trim().max(30)).default([]),
    prazo: Joi.date().iso().greater('now').optional(),
  }),
});

export const updateTodoValidator = validate({
  params: Joi.object({
    id: idParam,
  }),
  body: Joi.object({
    nome: Joi.string().trim().min(1).max(120),
    descricao: Joi.string().trim().max(500).allow(''),
    prioridade: Joi.string().valid('baixa', 'media', 'alta'),
    etiquetas: Joi.array().items(Joi.string().trim().max(30)),
    prazo: Joi.date().iso().greater('now').allow(null),
    concluido: Joi.boolean(),
  })
    .min(1)
    .messages({ 'object.min': 'Envie ao menos um campo para atualizar.' }),
});

export const concludeTodoValidator = validate({
  params: Joi.object({
    id: idParam,
  }),
});

export const deleteTodoValidator = concludeTodoValidator;

export const listTodosValidator = validate({
  query: Joi.object({
    q: Joi.string().trim().max(120),
    concluido: Joi.boolean().truthy('true').falsy('false'),
    prioridade: Joi.string().valid('baixa', 'media', 'alta'),
    page: Joi.number().integer().positive().default(1),
    pageSize: Joi.number().integer().positive().max(100).default(10),
  }),
});
