import { parseImportRows, validateImportStructure } from "@/lib/abc/member-import";

describe("validateImportStructure", () => {
  it("rejects when action column is missing", () => {
    const result = validateImportStructure([{ email: "a@b.com" }]);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/action/);
  });

  it("rejects when email column is missing", () => {
    const result = validateImportStructure([{ action: "create" }]);
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toMatch(/email/);
  });

  it("accepts valid structure", () => {
    const result = validateImportStructure([{ action: "create", email: "a@b.com" }]);
    expect(result.ok).toBe(true);
  });

  it("accepts empty rows array", () => {
    const result = validateImportStructure([]);
    expect(result.ok).toBe(true);
  });
});

describe("parseImportRows", () => {
  it("returns skip result for action=skip rows", () => {
    const rows = parseImportRows([{ action: "skip", email: "a@b.com" }]);
    expect(rows[0].action).toBe("skip");
  });

  it("normalizes action to lowercase", () => {
    const rows = parseImportRows([{ action: "CREATE", email: "a@b.com" }]);
    expect(rows[0].action).toBe("create");
  });

  it("returns error for unknown action value", () => {
    const rows = parseImportRows([{ action: "delete", email: "a@b.com" }]);
    expect(rows[0].parseError).toBeTruthy();
  });
});
