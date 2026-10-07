import axios from "axios";

export const BOOKINGS_URL = "http://localhost:5000/bookings";

// No login yet, so every booking is saved for this user; it must exist in the database.
const DEMO_USER_ID = 1;

// Form desk names mapped to the desk ids in the database.
export const DESK_IDS: Record<string, number> = {
  A01: 1,
  A02: 2,
  B01: 3,
  B02: 4,
};

export const DESK_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(DESK_IDS).map(([name, id]) => [id, name]),
);

// One booking row as returned by GET /bookings, matching the bookings and desks tables.
export interface ColleagueOpportunity {
  id: number;
  user_id: number;
  desk_id: number;
  booking_date: string; // e.g. "2026-10-12T00:00:00.000Z"
  active: boolean;
  desk: { id: number; name: string; floor: number };
}

// POST /bookings returns the row without the joined desk.
export type CreatedBooking = Omit<ColleagueOpportunity, "desk">;

export class UnexpectedResponseError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCreatedBooking(value: unknown): value is CreatedBooking {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.user_id === "number" &&
    typeof value.desk_id === "number" &&
    typeof value.booking_date === "string" &&
    typeof value.active === "boolean"
  );
}

function isColleagueOpportunity(value: unknown): value is ColleagueOpportunity {
  if (!isCreatedBooking(value)) return false;
  const desk: unknown = (value as Record<string, unknown>).desk;
  return (
    isRecord(desk) &&
    typeof desk.id === "number" &&
    typeof desk.name === "string" &&
    typeof desk.floor === "number"
  );
}

// Takes unknown on purpose: response.json() is typed any, so nothing is trusted until checked.
export function parseOpportunities(body: unknown): ColleagueOpportunity[] {
  if (!isRecord(body) || !Array.isArray(body.data)) {
    throw new UnexpectedResponseError("Expected an object with a data array");
  }
  const items: unknown[] = body.data;
  if (!items.every(isColleagueOpportunity)) {
    throw new UnexpectedResponseError("A booking in the response is missing or has a wrong-typed key");
  }
  return items;
}

interface NewBooking {
  desk_id: number;
  booking_date: string; // YYYY-MM-DD
  active: boolean;
}

export const OFFLINE_MESSAGE =
  "The database server is currently offline. Please check your connection.";

function toErrorMessage(err: unknown): string {
  if (err instanceof UnexpectedResponseError) {
    return "The server sent data in an unexpected format.";
  }
  if (axios.isAxiosError<{ error?: string }>(err)) {
    // The server answered with a 4xx/5xx status.
    if (err.response) {
      return err.response.data?.error ?? `The server returned an error (${err.response.status}).`;
    }
    // A timeout also has no response, so it is checked before the offline case.
    if (err.code === "ECONNABORTED" || err.code === "ETIMEDOUT") {
      return "The request timed out. Please try again.";
    }
    // No response at all: the server is down or the network is unreachable.
    return OFFLINE_MESSAGE;
  }
  return "Something went wrong. Please try again.";
}

export async function getOpportunities(signal: AbortSignal): Promise<ColleagueOpportunity[]> {
  try {
    const { data } = await axios.get<unknown>(BOOKINGS_URL, {
      params: { limit: 50 },
      signal,
      timeout: 8000,
    });
    return parseOpportunities(data);
  } catch (err) {
    // A cancelled request is the caller's doing, not a failure to report.
    if (axios.isCancel(err)) throw err;
    throw new Error(toErrorMessage(err));
  }
}

export async function postBooking(booking: NewBooking): Promise<CreatedBooking> {
  try {
    const { data } = await axios.post<unknown>(
      BOOKINGS_URL,
      { user_id: DEMO_USER_ID, ...booking },
      {
        headers: { Authorization: process.env.NEXT_PUBLIC_API_TOKEN ?? "" },
        timeout: 8000,
      },
    );
    if (!isCreatedBooking(data)) {
      throw new UnexpectedResponseError("Created booking is missing or has a wrong-typed key");
    }
    return data;
  } catch (err) {
    throw new Error(toErrorMessage(err));
  }
}
