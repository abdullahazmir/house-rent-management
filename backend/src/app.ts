import express, { type Express, type Request, type Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import apiRouter from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { handleStripeWebhook } from './webhooks/stripe.webhook';

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_APP_URL,
    credentials: true,
  }),
);
app.use(morgan('dev'));

// Mounted before express.json() — Stripe webhook signature verification needs the raw request body.
app.post('/api/v1/webhooks/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/v1', apiRateLimit, apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
