"use client";

import { useEffect, useState } from "react";
import { BOOKINGS_URL, DESK_IDS, postBooking, type ApiBookingWithDesk } from "@/lib/api";
import BookingCard, { type BookingCardProps } from "./BookingCard";
import RegistrationForm from "./RegistrationForm";
import styles from "./BookingList.module.css";

interface Booking extends BookingCardProps {
  id: number;
}

interface BookingsResponse {
  data: ApiBookingWithDesk[];
}

function toBooking(b: ApiBookingWithDesk): Booking {
  return {
    id: b.id,
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
        const response = await fetch(`${BOOKINGS_URL}?limit=50`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Request failed with ${response.status}`);
        const body: BookingsResponse = await response.json();
        setBookings(body.data.map(toBooking));
      } catch {
        if (controller.signal.aborted) return;
        setError("Could not load bookings. Check that the API is running.");
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
    setBookings((prev) => [...prev, { ...booking, id: tempId }]);

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

  const needle = query.trim().toLowerCase();
  const visible = bookings.filter((b) =>
    [b.desk, `floor ${b.floor}`, b.date, b.active ? "active" : "inactive"]
      .join(" ")
      .toLowerCase()
      .includes(needle),
  );

  return (
    <section className={styles.list}>
      <RegistrationForm onAdd={addBooking} existingBookings={bookings} />
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
