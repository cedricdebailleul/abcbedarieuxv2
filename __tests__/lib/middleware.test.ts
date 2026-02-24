import { NextRequest } from "next/server";

// Mock middleware logic (extracted for testability)
const protectedPrefixes = ["/dashboard", "/api/admin"];
const publicPrefixes = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/newsletter",
  "/api/places",
  "/_next",
  "/favicon.ico",
];

function isPublicRoute(path: string): boolean {
  return publicPrefixes.some(
    (prefix) => path === prefix || (prefix !== "/" && path.startsWith(prefix))
  );
}

function isProtectedRoute(path: string): boolean {
  return protectedPrefixes.some((prefix) => path.startsWith(prefix));
}

describe("Middleware route matching", () => {
  it("should identify public routes correctly", () => {
    expect(isPublicRoute("/")).toBe(true);
    expect(isPublicRoute("/login")).toBe(true);
    expect(isPublicRoute("/register")).toBe(true);
    expect(isPublicRoute("/api/auth/signin")).toBe(true);
    expect(isPublicRoute("/api/newsletter/subscribe")).toBe(true);
    expect(isPublicRoute("/api/places/123")).toBe(true);
    expect(isPublicRoute("/_next/static/chunk.js")).toBe(true);
  });

  it("should identify protected routes correctly", () => {
    expect(isProtectedRoute("/dashboard")).toBe(true);
    expect(isProtectedRoute("/dashboard/admin")).toBe(true);
    expect(isProtectedRoute("/api/admin/newsletter/campaigns")).toBe(true);
    expect(isProtectedRoute("/api/admin/backup/database")).toBe(true);
  });

  it("should not mark public routes as protected", () => {
    expect(isProtectedRoute("/")).toBe(false);
    expect(isProtectedRoute("/login")).toBe(false);
    expect(isProtectedRoute("/api/auth/signin")).toBe(false);
    expect(isProtectedRoute("/api/newsletter/subscribe")).toBe(false);
  });

  it("should not mark protected routes as public", () => {
    expect(isPublicRoute("/dashboard")).toBe(false);
    expect(isPublicRoute("/dashboard/admin")).toBe(false);
    expect(isPublicRoute("/api/admin/newsletter/campaigns")).toBe(false);
  });
});
