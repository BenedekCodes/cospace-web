"use client";

import { useEffect, useState } from "react";
import {
  DESK_IDS,
  DESK_NAMES,
  getOpportunities,
  postBooking,
  type ColleagueOpportunity,
} from "@/lib/api";
import BookingCard, { type BookingCardProps } from "./BookingCard";
import RegistrationForm from "./RegistrationForm";
import styles from "./BookingList.module.css";

interface Booking extends BookingCardProps {
  id: number;
  deskId: number;
}

function toBooking(b: ColleagueOpportunity): Booking {
  return {
    id: b.id,
    deskId: b.desk_id,
    desk: b.desk.name,
    floor: b.desk.floor,
    date: b.booking_date.slice(0, 10),
    active: b.active,
  };
}

export default function BookingList() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadBookings() {
      try {
        const opportunities = await getOpportunities(controller.signal);
        setBookings(opportunities.map(toBooking));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadBookings();
    return () => controller.abort();
  }, []);

  async function addBooking(booking: BookingCardProps) {
    const deskId = DESK_IDS[booking.desk];
    if (deskId === undefined) throw new Error(`Unknown desk ${booking.desk}.`);

    // Show the card straight away under a temporary negative id, then swap in the real one.
    const tempId = -Date.now();
    setBookings((prev) => [...prev, { ...booking, id: tempId, deskId }]);

    try {
      const saved = await postBooking({
        desk_id: deskId,
        booking_date: booking.date,
        active: booking.active,
      });
      setBookings((prev) => prev.map((b) => (b.id === tempId ? { ...b, id: saved.id } : b)));
    } catch (err) {
      setBookings((prev) => prev.filter((b) => b.id !== tempId));
      throw err;
    }
  }

  // The form uses names like A01 while the API names desks Desk-01, so compare by desk id.
  const existingBookings = bookings.map((b) => ({
    desk: DESK_NAMES[b.deskId] ?? b.desk,
    date: b.date,
  }));

  const needle = query.trim().toLowerCase();
  const visible = bookings.filter((b) =>
    [b.desk, `floor ${b.floor}`, b.date, b.active ? "active" : "inactive"]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );

  return (
    <section className={styles.list}>
      <RegistrationForm onAdd={addBooking} existingBookings={existingBookings} />
      <input
        type="search"
        className={styles.search}
        placeholder="Search by desk, floor, date or status"
        aria-label="Search bookings"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {isLoading ? (
        <p role="status" className={styles.empty}>
          Loading...
        </p>
      ) : error ? (
        <p role="alert" className={styles.empty}>
          {error}
        </p>
      ) : bookings.length === 0 ? (
        <p className={styles.empty}>No bookings yet.</p>
      ) : visible.length === 0 ? (
        <p className={styles.empty}>No bookings match &ldquo;{query}&rdquo;.</p>
      ) : (
        visible.map((booking) => <BookingCard key={booking.id} {...booking} />)
      )}
    </section>
  );
}
