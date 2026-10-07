"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import {
  getDateBounds,
  DESK_LENGTH,
  validateBooking,
  type BookingErrors,
  type BookingValues,
} from "./bookingValidation";
import styles from "./CreateBookingForm.module.css";

interface CreateBookingFormProps {
  onAdd: (booking: BookingValues) => void;
}

export default function CreateBookingForm({ onAdd }: CreateBookingFormProps) {
  const [desk, setDesk] = useState("");
  const [floor, setFloor] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<BookingErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const deskInputRef = useRef<HTMLInputElement>(null);
  const dateBounds = getDateBounds();

  // One handler for all inputs; the input's name picks which state to update.
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === "desk") setDesk(value.toUpperCase());
    else if (name === "floor") setFloor(value);
    else if (name === "date") setDate(value);
    setIsSuccess(false);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Stops the browser from reloading the page.
    e.preventDefault();

    if (isLoading) return;

    const nextErrors = validateBooking({ desk, floor, date });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSuccess(false);
    setIsLoading(true);

    // Simulated network request.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    onAdd({ desk: desk.trim(), floor: floor.trim(), date });
    setDesk("");
    setFloor("");
    setDate("");
    setIsLoading(false);
    setIsSuccess(true);
    deskInputRef.current?.focus();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label className={styles.label}>
          Desk
          <input
            ref={deskInputRef}
            className={styles.input}
            type="text"
            name="desk"
            maxLength={DESK_LENGTH}
            value={desk}
            onChange={handleChange}
            aria-invalid={errors.desk ? true : undefined}
            aria-describedby={errors.desk ? "desk-error" : undefined}
          />
        </label>
        {errors.desk && (
          <span id="desk-error" role="alert" className={styles.error}>
            {errors.desk}
          </span>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>
          Floor
          <input
            className={styles.input}
            type="text"
            name="floor"
            inputMode="numeric"
            maxLength={2}
            value={floor}
            onChange={handleChange}
            aria-invalid={errors.floor ? true : undefined}
            aria-describedby={errors.floor ? "floor-error" : undefined}
          />
        </label>
        {errors.floor && (
          <span id="floor-error" role="alert" className={styles.error}>
            {errors.floor}
          </span>
        )}
      </div>
      <div className={styles.field}>
        <label className={styles.label}>
          Date
          <input
            className={styles.input}
            type="date"
            name="date"
            min={dateBounds.min}
            max={dateBounds.max}
            value={date}
            onChange={handleChange}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? "date-error" : undefined}
          />
        </label>
        {errors.date && (
          <span id="date-error" role="alert" className={styles.error}>
            {errors.date}
          </span>
        )}
      </div>
      <button className={styles.button} type="submit" disabled={isLoading}>
        {isLoading ? "Creating..." : "Create booking"}
      </button>
      {isSuccess && (
        <p role="status" className={styles.success}>
          Booking created successfully.
        </p>
      )}
    </form>
  );
}
