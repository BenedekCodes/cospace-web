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

export interface ApiBooking {
  id: number;
  user_id: number;
  desk_id: number;
  booking_date: string; // e.g. "2026-10-12T00:00:00.000Z"
  active: boolean;
}

// GET /bookings includes the desk; the POST response does not.
export interface ApiBookingWithDesk extends ApiBooking {
  desk: { id: number; name: string; floor: number };
}

interface NewBooking {
  desk_id: number;
  booking_date: string; // YYYY-MM-DD
  active: boolean;
}

function toErrorMessage(err: unknown): string {
  if (axios.isAxiosError<{ error?: string }>(err)) {
    // The server answered with a 4xx/5xx status.
    if (err.response) {
      return err.response.data?.error ?? `The server returned an error (${err.response.status}).`;
    }
    if (err.code === "ECONNABORTED") {
      return "The request timed out. Please try again.";
    }
    // No response at all: server down, network offline or request blocked.
    return "Cannot reach the server. Check your connection and that the API is running.";
  }
  return "Something went wrong. Please try again.";
}

export async function postBooking(booking: NewBooking): Promise<ApiBooking> {
  try {
    const { data } = await axios.post<ApiBooking>(
      BOOKINGS_URL,
      { user_id: DEMO_USER_ID, ...booking },
      {
        headers: { Authorization: process.env.NEXT_PUBLIC_API_TOKEN ?? "" },
        timeout: 8000,
      },
    );
    return data;
  } catch (err) {
    throw new Error(toErrorMessage(err));
  }
}
