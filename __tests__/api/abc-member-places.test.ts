import { buildMemberPlaceRows } from "@/lib/abc/member-place-utils";

describe("buildMemberPlaceRows", () => {
  it("returns empty array for member with no places", () => {
    expect(buildMemberPlaceRows([])).toEqual([]);
  });

  it("maps role to French label", () => {
    const rows = buildMemberPlaceRows([
      {
        id: "1",
        placeId: "p1",
        role: "GERANT",
        place: {
          name: "Commerce A",
          slug: "commerce-a",
          streetNumber: "12",
          street: "Rue de la Paix",
          postalCode: "34600",
          city: "Bédarieux",
        },
        createdAt: new Date(),
      },
    ]);
    expect(rows[0].roleLabel).toBe("Gérant");
    expect(rows[0].placeNom).toBe("Commerce A");
    expect(rows[0].placeAdresse).toBe("12 Rue de la Paix 34600 Bédarieux");
  });
});
