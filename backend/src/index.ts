import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import pool, { runMigrations } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import recipesRouter from './routes/recipes';
import ingredientsRouter from './routes/ingredients';
import lotsRouter from './routes/lots';
import logger from './utils/logger';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'error' });
  }
});

app.use('/api/recipes', recipesRouter);
app.use('/api/ingredients', ingredientsRouter);
app.use('/api/lots', lotsRouter);

app.use(errorHandler);

async function start() {
  await runMigrations();
  const server = app.listen(PORT, () => {
    logger.info(`Backend running on port ${PORT}`);
  });

  function shutdown(signal: string) {
    logger.info(`${signal} received, shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      pool.end().then(() => {
        logger.info('Database pool closed');
        process.exit(0);
      });
    });
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error(err, 'Failed to start');
  process.exit(1);
});
