"use client";

import { useState, type FormEvent } from "react";
import type { BookingCardProps } from "./BookingCard";
import styles from "./RegistrationForm.module.css";

interface RegistrationFormProps {
  onAdd: (booking: BookingCardProps) => void;
}

export default function RegistrationForm({ onAdd }: RegistrationFormProps) {
  const [desk, setDesk] = useState("");
  const [floor, setFloor] = useState("");
  const [date, setDate] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Stops the browser from reloading the page with a native form POST/GET.
    e.preventDefault();

    onAdd({ desk: desk.trim(), floor: Number(floor), date, active: true });
    setDesk("");
    setFloor("");
    setDate("");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Desk (e.g. A12)"
        aria-label="Desk"
        value={desk}
        onChange={(e) => setDesk(e.target.value)}
        required
      />
      <input
        className={styles.input}
        type="number"
        min={0}
        placeholder="Floor"
        aria-label="Floor"
        value={floor}
        onChange={(e) => setFloor(e.target.value)}
        required
      />
      <input
        className={styles.input}
        type="date"
        aria-label="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />
      <button className={styles.button} type="submit">
        Add booking
      </button>
    </form>
  );
}
