import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import todosRouter from './routes/todosRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/todos', todosRouter);

app.use(errorHandler);

export default app;
