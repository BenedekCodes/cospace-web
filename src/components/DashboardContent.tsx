"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";
import BookingsTable, { type TableBooking } from "./BookingsTable";
import CreateBookingForm from "./CreateBookingForm";
import styles from "./DashboardContent.module.css";

const INITIAL_BOOKINGS: TableBooking[] = [
  { id: 1, desk: "A12", floor: "2", date: "2026-10-12", status: "Active" },
  { id: 2, desk: "B07", floor: "4", date: "2026-10-15", status: "Active" },
  { id: 3, desk: "C03", floor: "1", date: "2026-09-30", status: "Inactive" },
];

export default function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<TableBooking[]>(INITIAL_BOOKINGS);

  function addBooking(booking: Pick<TableBooking, "desk" | "floor" | "date">) {
    setBookings((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((b) => b.id)) + 1,
        ...booking,
        status: "Active",
      },
    ]);
  }

  return (
    <div className={styles.content}>
      <header className={styles.header}>
        <h1>Dashboard</h1>
        <button
          type="button"
          className={styles.button}
          onClick={() => setIsModalOpen(true)}
        >
          New booking
        </button>
      </header>

      <BookingsTable bookings={bookings} />

      <BaseModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 className={styles.modalTitle}>New booking</h2>
        <CreateBookingForm onAdd={addBooking} existingBookings={bookings} />
      </BaseModal>
    </div>
  );
}
