// Vercel serverless entry point. All /api/* requests are routed here (see
// vercel.json) and handled by the existing Express app, which already mounts
// every route under /api/... — including the raw-body Stripe webhook.
import app from '../server/index';

export default app;
