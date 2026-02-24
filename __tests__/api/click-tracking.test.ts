// Test click tracking URL validation logic
const ALLOWED_DOMAINS = [
  "abc-bedarieux.fr",
  "www.abc-bedarieux.fr",
  "abcbedarieux.com",
  "www.abcbedarieux.com",
  "localhost:3000",
  "localhost:3001",
  "127.0.0.1:3000",
  "127.0.0.1:3001",
];

const ALLOW_EXTERNAL_NEWSLETTER_LINKS = true;

function validateRedirectUrl(url: string, requestUrl: string): URL {
  try {
    const targetUrl = new URL(decodeURIComponent(url));

    if (ALLOW_EXTERNAL_NEWSLETTER_LINKS && targetUrl.protocol === "https:") {
      return targetUrl;
    }

    if (
      ALLOWED_DOMAINS.includes(targetUrl.hostname) ||
      ALLOWED_DOMAINS.includes(`${targetUrl.hostname}:${targetUrl.port}`)
    ) {
      return targetUrl;
    }

    return new URL("/", requestUrl);
  } catch {
    return new URL("/", requestUrl);
  }
}

describe("Click tracking URL validation", () => {
  const baseUrl = "https://abcbedarieux.com";

  it("should allow own domain URLs", () => {
    const result = validateRedirectUrl("https://abcbedarieux.com/events", baseUrl);
    expect(result.hostname).toBe("abcbedarieux.com");
    expect(result.pathname).toBe("/events");
  });

  it("should allow external https URLs for newsletter links", () => {
    const result = validateRedirectUrl("https://example.com/article", baseUrl);
    expect(result.hostname).toBe("example.com");
    expect(result.pathname).toBe("/article");
  });

  it("should reject http (non-https) external URLs", () => {
    const result = validateRedirectUrl("http://malicious.com/hack", baseUrl);
    expect(result.pathname).toBe("/");
  });

  it("should reject javascript: protocol URLs", () => {
    const result = validateRedirectUrl("javascript:alert(1)", baseUrl);
    expect(result.pathname).toBe("/");
  });

  it("should handle malformed URLs gracefully", () => {
    const result = validateRedirectUrl("not-a-url", baseUrl);
    expect(result.pathname).toBe("/");
  });

  it("should allow localhost URLs in development", () => {
    const result = validateRedirectUrl("http://localhost:3000/test", baseUrl);
    expect(result.hostname).toBe("localhost");
    expect(result.port).toBe("3000");
  });
});
