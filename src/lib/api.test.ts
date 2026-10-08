import { parseOpportunities, UnexpectedResponseError } from "@/lib/api";

describe("parseOpportunities", () => {
  it("rejects a body without a data array", () => {
    expect(() => parseOpportunities({})).toThrow(UnexpectedResponseError);
  });

  it("accepts a booking row with its desk", () => {
    const row = {
      id: 1,
      user_id: 1,
      desk_id: 1,
      booking_date: "2026-10-20T00:00:00.000Z",
      active: true,
      desk: { id: 1, name: "A12", floor: 2 },
    };

    expect(parseOpportunities({ data: [row] })).toEqual([row]);
  });
});
