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

export async function postBooking(booking: NewBooking): Promise<ApiBooking> {
  try {
    const { data } = await axios.post<ApiBooking>(
      BOOKINGS_URL,
      { user_id: DEMO_USER_ID, ...booking },
      { headers: { Authorization: process.env.NEXT_PUBLIC_API_TOKEN ?? "" } },
    );
    return data;
  } catch (err) {
    if (axios.isAxiosError<{ error?: string }>(err) && err.response?.data?.error) {
      throw new Error(err.response.data.error);
    }
    throw new Error("Could not save the booking. Check that the API is running.");
  }
}
