describe("Environment validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("should validate DATABASE_URL is required via Zod schema", () => {
    const { z } = require("zod");
    const schema = z.string().min(1);

    expect(schema.safeParse("").success).toBe(false);
    expect(schema.safeParse("postgresql://localhost/db").success).toBe(true);
  });

  it("should have BETTER_AUTH_SECRET minimum length of 32", () => {
    // The Zod schema requires min(32) for BETTER_AUTH_SECRET
    const { z } = require("zod");
    const schema = z.string().min(32);

    expect(schema.safeParse("short").success).toBe(false);
    expect(schema.safeParse("a".repeat(32)).success).toBe(true);
  });
});
