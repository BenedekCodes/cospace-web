"use client";

import { useState } from "react";
import BaseModal from "./BaseModal";
import type { BookingCardProps } from "./BookingCard";
import BookingsTable, { type TableBooking } from "./BookingsTable";
import RegistrationForm from "./RegistrationForm";
import styles from "./DashboardContent.module.css";

const INITIAL_BOOKINGS: TableBooking[] = [
  { id: 1, desk: "A12", floor: 2, date: "2026-10-12", status: "Active" },
  { id: 2, desk: "B07", floor: 4, date: "2026-10-15", status: "Active" },
  { id: 3, desk: "C03", floor: 1, date: "2026-09-30", status: "Inactive" },
];

export default function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState<TableBooking[]>(INITIAL_BOOKINGS);

  function addBooking({ desk, floor, date, active }: BookingCardProps) {
    setBookings((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((b) => b.id)) + 1,
        desk,
        floor,
        date,
        status: active ? "Active" : "Inactive",
      },
    ]);
    setIsModalOpen(false);
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
        <RegistrationForm onAdd={addBooking} />
      </BaseModal>
    </div>
  );
}
