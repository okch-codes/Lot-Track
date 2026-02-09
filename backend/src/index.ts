import express from 'express';
import cors from 'cors';
import { runMigrations } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import recipesRouter from './routes/recipes';
import ingredientsRouter from './routes/ingredients';
import lotsRouter from './routes/lots';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/recipes', recipesRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/lots', lotsRouter);

app.use(errorHandler);

async function start() {
  await runMigrations();
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
