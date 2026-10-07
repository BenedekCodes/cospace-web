"use client";

import { useState } from "react";
import BookingCard, { type BookingCardProps } from "./BookingCard";
import RegistrationForm from "./RegistrationForm";
import styles from "./BookingList.module.css";

interface Booking extends BookingCardProps {
  id: number;
}

const INITIAL_BOOKINGS: Booking[] = [
  { id: 1, desk: "A12", floor: 2, date: "2026-10-12", active: true },
  { id: 2, desk: "B07", floor: 4, date: "2026-10-15", active: true },
  { id: 3, desk: "C03", floor: 1, date: "2026-09-30", active: false },
];

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [query, setQuery] = useState("");

  function addBooking(booking: BookingCardProps) {
    setBookings((prev) => [
      ...prev,
      { ...booking, id: Math.max(0, ...prev.map((b) => b.id)) + 1 },
    ]);
  }

  const needle = query.trim().toLowerCase();
  const visible = bookings.filter((b) =>
    [b.desk, `floor ${b.floor}`, b.date, b.active ? "active" : "inactive"]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );

  return (
    <section className={styles.list}>
      <RegistrationForm onAdd={addBooking} />
      <input
        type="search"
        className={styles.search}
        placeholder="Search by desk, floor, date or status"
        aria-label="Search bookings"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {visible.length === 0 ? (
        <p className={styles.empty}>No bookings match &ldquo;{query}&rdquo;.</p>
      ) : (
        visible.map((booking) => <BookingCard key={booking.id} {...booking} />)
      )}
    </section>
  );
}
