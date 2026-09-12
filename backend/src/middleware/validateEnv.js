const REQUIRED_VARS = [
  'JWT_SECRET',
  'STAFF_USERNAME',
  'STAFF_PASSWORD',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'STORAGE_BACKEND',
];

export function validateEnv() {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(
      `[CampusPrint] Fatal: Missing required environment variables:\n  ${missing.join('\n  ')}\n` +
        'Please copy .env.example to .env and fill in the required values.'
    );
    process.exit(1);
  }
}
