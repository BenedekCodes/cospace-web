import Link from "next/link";

type Booking = {
  id: string;
  desk: string;
  floor: number;
  date: string; // ISO date (YYYY-MM-DD)
};

const MOCK_BOOKINGS: Booking[] = [
  { id: "1", desk: "A-12", floor: 2, date: "2026-10-12" },
  { id: "2", desk: "B-04", floor: 3, date: "2026-10-13" },
  { id: "3", desk: "C-27", floor: 1, date: "2026-10-14" },
];

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingPage({ params }: PageProps) {
  // params is a Promise in this Next.js version; params.id directly would not type-check.
  const { id } = await params;

  const booking = MOCK_BOOKINGS.find((b) => b.id === id);
  if (!booking) {
    return (
      <main style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
        <h1>Booking not found</h1>
        <p>This desk booking does not exist or has been removed.</p>
        <Link href="/">Back to home</Link>
      </main>
    );
  }

  const formattedDate = new Date(`${booking.date}T00:00:00Z`).toLocaleDateString(
    "en-GB",
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" },
  );

  return (
    <main style={{ maxWidth: 480, margin: "2rem auto", padding: "0 1rem" }}>
      <h1>Booking #{booking.id}</h1>
      <dl>
        <dt>Desk</dt>
        <dd>{booking.desk}</dd>
        <dt>Floor</dt>
        <dd>{booking.floor}</dd>
        <dt>Date</dt>
        <dd>{formattedDate}</dd>
      </dl>
      <Link href="/">Back to home</Link>
    </main>
  );
}
