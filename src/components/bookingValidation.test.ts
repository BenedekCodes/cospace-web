import { validateBooking } from "./bookingValidation";

describe("validateBooking", () => {
  it("asks for a desk when the form is empty", () => {
    const errors = validateBooking({ desk: "", floor: "", date: "" });

    expect(errors.desk).toBe("Enter a desk, for example A12.");
  });

  it("rejects a desk that is not one letter and two digits", () => {
    const errors = validateBooking({ desk: "A1", floor: "2", date: "" });

    expect(errors.desk).toBe(
      "Desk must be one letter followed by two digits, for example A12.",
    );
  });
});
