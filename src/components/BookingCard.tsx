import Link from "next/link";
import styles from "./BookingCard.module.css";

export interface BookingCardProps {
  desk: string;
  floor: number;
  date: string; // ISO date, e.g. "2026-10-12"
  active: boolean;
}

export default function BookingCard({
  id,
  desk,
  floor,
  date,
  active,
}: BookingCardProps & { id: number }) {
  const formattedDate = new Date(date).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <Link href={`/bookings/${id}`} className={styles.link}>
      <article
        className={`${styles.card} ${active ? styles.cardActive : styles.cardInactive}`}
      >
        <header className={styles.header}>
          <h2 className={styles.title}>Desk {desk}</h2>
          <span className={active ? styles.active : styles.inactive}>
            {active ? "Active" : "Inactive"}
          </span>
        </header>
        <dl className={styles.details}>
          <div>
            <dt>Floor</dt>
            <dd>{floor}</dd>
          </div>
          <div>
            <dt>Date</dt>
            <dd>
              <time dateTime={date}>{formattedDate}</time>
            </dd>
          </div>
        </dl>
        <span className={styles.cta} aria-hidden="true">
          View details &rarr;
        </span>
      </article>
    </Link>
  );
}
