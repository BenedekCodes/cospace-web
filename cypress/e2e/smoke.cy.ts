describe("home page", () => {
  it("shows the booking search box", () => {
    cy.visit("/");

    cy.get('input[type="search"][aria-label="Search bookings"]').should("be.visible");
  });
});
