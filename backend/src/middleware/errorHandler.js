/**
 * Global Express error handler.
 * Returns structured JSON and logs the full error server-side.
 * Never exposes stack traces to the client.
 */
export function errorHandler(err, req, res, _next) {
  console.error('[CampusPrint] Unhandled error:', err);

  const status = err.status || 500;
  const message =
    status === 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'An error occurred.';

  return res.status(status).json({ message });
}
