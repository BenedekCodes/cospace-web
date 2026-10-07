export type BookingField = "desk" | "floor" | "date";
export type BookingValues = Record<BookingField, string>;
export type BookingErrors = Partial<Record<BookingField, string>>;
export type ExistingBooking = Pick<BookingValues, "desk" | "date">;

export const DESK_LENGTH = 3;
export const MAX_FLOOR = 99;
const MAX_MONTHS_AHEAD = 6;

// en-CA formats as YYYY-MM-DD, matching <input type="date"> values.
function toIsoDate(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

export function getDateBounds(): { min: string; max: string } {
  const today = new Date();
  const latest = new Date(
    today.getFullYear(),
    today.getMonth() + MAX_MONTHS_AHEAD,
    today.getDate(),
  );
  // Day overflowed into the next month (e.g. 31 Aug + 6 months): use the month's last day.
  if (latest.getDate() !== today.getDate()) latest.setDate(0);
  return { min: toIsoDate(today), max: toIsoDate(latest) };
}

export function validateBooking(
  { desk, floor, date }: BookingValues,
  existing: ExistingBooking[] = [],
): BookingErrors {
  const errors: BookingErrors = {};
  const trimmedDesk = desk.trim();
  const trimmedFloor = floor.trim();

  if (!trimmedDesk) {
    errors.desk = "Enter a desk, for example A12.";
  } else if (!/^[A-Z][0-9]{2}$/.test(trimmedDesk)) {
    errors.desk = "Desk must be one letter followed by two digits, for example A12.";
  }

  if (!trimmedFloor) {
    errors.floor = "Enter a floor number.";
  } else if (!/^\d+$/.test(trimmedFloor)) {
    errors.floor = "Floor must be a whole number.";
  } else if (Number(trimmedFloor) > MAX_FLOOR) {
    errors.floor = `Floor can be at most ${MAX_FLOOR}.`;
  }

  const { min, max } = getDateBounds();
  const parsedDate = new Date(`${date}T00:00:00`);
  // The round trip catches impossible dates like 2027-02-30 that JS rolls over.
  if (!date || Number.isNaN(parsedDate.getTime()) || toIsoDate(parsedDate) !== date) {
    errors.date = "Enter a valid date.";
  } else if (date < min) {
    errors.date = "Date cannot be in the past.";
  } else if (date > max) {
    errors.date = `Date must be within the next ${MAX_MONTHS_AHEAD} months.`;
  }

  // A desk can only be booked once per date; report it on the desk field.
  if (
    !errors.desk &&
    !errors.date &&
    existing.some((b) => b.desk === trimmedDesk && b.date === date)
  ) {
    errors.desk = `Desk ${trimmedDesk} is already booked on ${date}.`;
  }

  return errors;
}
