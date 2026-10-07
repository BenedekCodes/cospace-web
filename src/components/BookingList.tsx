"use client";

import { useEffect, useState } from "react";
import BookingCard, { type BookingCardProps } from "./BookingCard";
import RegistrationForm from "./RegistrationForm";
import styles from "./BookingList.module.css";

interface Booking extends BookingCardProps {
  id: number;
}

interface ApiBooking {
  id: number;
  user_id: number;
  desk_id: number;
  booking_date: string; // e.g. "2026-10-12T00:00:00.000Z"
  active: boolean;
  desk: { id: number; name: string; floor: number };
}

interface BookingsResponse {
  data: ApiBooking[];
}

const BOOKINGS_URL = "http://localhost:5000/bookings?limit=50";

function toBooking(b: ApiBooking): Booking {
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
        const response = await fetch(BOOKINGS_URL, { signal: controller.signal });
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
