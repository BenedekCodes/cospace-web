"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { DESK_IDS } from "@/lib/api";
import type { BookingCardProps } from "./BookingCard";
import {
  getDateBounds,
  DESK_LENGTH,
  MAX_FLOOR,
  validateBooking,
  type BookingErrors,
  type BookingField,
  type ExistingBooking,
} from "./bookingValidation";
import styles from "./RegistrationForm.module.css";

interface RegistrationFormProps {
  onAdd: (booking: BookingCardProps) => Promise<void>;
  existingBookings: ExistingBooking[];
}

type Field = BookingField;
type Errors = BookingErrors;

const FIELD_ORDER: Field[] = ["desk", "floor", "date"];

export default function RegistrationForm({
  onAdd,
  existingBookings,
}: RegistrationFormProps) {
  const [desk, setDesk] = useState("");
  const [floor, setFloor] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const baseId = useId();
  const inputRefs = useRef<Record<Field, HTMLInputElement | null>>({
    desk: null,
    floor: null,
    date: null,
  });

  function validate(): Errors {
    const next = validateBooking({ desk, floor, date }, existingBookings);
    if (!next.desk && !(desk.trim() in DESK_IDS)) {
      next.desk = `Unknown desk. Use one of ${Object.keys(DESK_IDS).join(", ")}.`;
    }
    return next;
  }

  function clearError(field: Field) {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    // Stops the browser from reloading the page with a native form POST/GET.
    e.preventDefault();

    if (isLoading) return;

    const next = validate();
    setErrors(next);
    setSubmitError(null);

    // Moving focus to the first invalid field makes screen readers announce its error.
    const firstInvalid = FIELD_ORDER.find((field) => next[field]);
    if (firstInvalid) {
      inputRefs.current[firstInvalid]?.focus();
      return;
    }

    setIsLoading(true);
    try {
      await onAdd({ desk: desk.trim(), floor: Number(floor), date, active: true });
      setDesk("");
      setFloor("");
      setDate("");
      inputRefs.current.desk?.focus();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save the booking.");
    } finally {
      setIsLoading(false);
    }
  }

  function a11yProps(field: Field) {
    const errorId = `${baseId}-${field}-error`;
    const invalid = Boolean(errors[field]);
    return {
      errorId,
      inputProps: {
        className: styles.input,
        "aria-required": true,
        "aria-invalid": invalid || undefined,
        "aria-describedby": invalid ? errorId : undefined,
      },
    };
  }

  const deskA11y = a11yProps("desk");
  const floorA11y = a11yProps("floor");
  const dateA11y = a11yProps("date");
  const dateBounds = getDateBounds();

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <input
          {...deskA11y.inputProps}
          ref={(el) => {
            inputRefs.current.desk = el;
          }}
          placeholder="Desk (e.g. A12)"
          aria-label="Desk"
          maxLength={DESK_LENGTH}
          value={desk}
          onChange={(e) => {
            setDesk(e.target.value.toUpperCase());
            clearError("desk");
          }}
        />
        {errors.desk && (
          <p id={deskA11y.errorId} role="alert" className={styles.error}>
            {errors.desk}
          </p>
        )}
      </div>
      <div className={styles.field}>
        <input
          {...floorA11y.inputProps}
          ref={(el) => {
            inputRefs.current.floor = el;
          }}
          type="number"
          min={0}
          max={MAX_FLOOR}
          placeholder="Floor"
          aria-label="Floor"
          value={floor}
          onChange={(e) => {
            setFloor(e.target.value);
            clearError("floor");
          }}
        />
        {errors.floor && (
          <p id={floorA11y.errorId} role="alert" className={styles.error}>
            {errors.floor}
          </p>
        )}
      </div>
      <div className={styles.field}>
        <input
          {...dateA11y.inputProps}
          ref={(el) => {
            inputRefs.current.date = el;
          }}
          type="date"
          min={dateBounds.min}
          max={dateBounds.max}
          aria-label="Date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            clearError("date");
          }}
        />
        {errors.date && (
          <p id={dateA11y.errorId} role="alert" className={styles.error}>
            {errors.date}
          </p>
        )}
      </div>
      <button className={styles.button} type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Add booking"}
      </button>
      {submitError && (
        <p role="alert" className={styles.alertBox}>
          {submitError}
        </p>
      )}
    </form>
  );
}
