// Set test environment variables
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.BETTER_AUTH_SECRET = "test-secret-that-is-at-least-32-characters-long";
process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = "test-api-key";
process.env.NEXT_PUBLIC_URL = "http://localhost:3000";
process.env.SKIP_ENV_VALIDATION = "true";
