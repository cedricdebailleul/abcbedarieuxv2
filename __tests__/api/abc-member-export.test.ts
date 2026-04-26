import { buildMemberRows, membersToWorkbook } from "@/lib/abc/member-export";

const fakeMember = {
  memberNumber: "ABC001",
  type: "ACTIF",
  role: "MEMBRE",
  status: "ACTIVE",
  membershipDate: new Date("2024-01-15"),
  expiresAt: new Date("2024-12-31"),
  joinedAt: new Date("2024-01-15"),
  user: {
    email: "test@example.com",
    name: "Marie Dupont",
    profile: { firstname: "Marie", lastname: "Dupont", phone: "0612345678" },
  },
  payments: [
    { year: 2024, amount: 50, status: "PAID", createdAt: new Date("2024-03-01") },
  ],
  places: [
    {
      place: {
        name: "Boutique Test",
        streetNumber: "12",
        street: "Rue de la Paix",
        postalCode: "34600",
        city: "Bédarieux",
      },
    },
  ],
};

describe("buildMemberRows", () => {
  it("builds a row with all expected fields", () => {
    const rows = buildMemberRows([fakeMember as any]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    expect(row.action).toBe("update");
    expect(row.email).toBe("test@example.com");
    expect(row.nom).toBe("Dupont");
    expect(row.prenom).toBe("Marie");
    expect(row.telephone).toBe("0612345678");
    expect(row.cotisationAnnee).toBe(2024);
    expect(row.placeNom).toBe("Boutique Test");
  });

  it("falls back to user.name split when profile missing", () => {
    const member = { ...fakeMember, user: { ...fakeMember.user, name: "Jean Martin", profile: null } };
    const rows = buildMemberRows([member as any]);
    expect(rows[0].prenom).toBe("Jean");
    expect(rows[0].nom).toBe("Martin");
  });

  it("returns empty strings for missing optional fields", () => {
    const member = { ...fakeMember, payments: [], places: [] };
    const rows = buildMemberRows([member as any]);
    expect(rows[0].cotisationAnnee).toBe("");
    expect(rows[0].placeNom).toBe("");
  });
});

describe("membersToWorkbook", () => {
  it("creates a workbook with one sheet", () => {
    const wb = membersToWorkbook(buildMemberRows([fakeMember as any]));
    expect(wb.SheetNames).toHaveLength(1);
  });
});
