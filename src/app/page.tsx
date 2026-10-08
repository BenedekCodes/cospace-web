import BookingList from "@/components/BookingList";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>My bookings</h1>
      <BookingList />
    </main>
  );
}
