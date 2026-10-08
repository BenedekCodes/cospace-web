import { render, screen } from "@testing-library/react";
import BookingCard from "./BookingCard";

describe("BookingCard", () => {
  it("links to the booking detail route and shows the desk", () => {
    render(<BookingCard id={1} desk="A12" floor={2} date="2026-10-20" active />);

    expect(screen.getByRole("link")).toHaveAttribute("href", "/bookings/1");
    expect(screen.getByRole("heading", { name: "Desk A12" })).toBeInTheDocument();
  });
});
