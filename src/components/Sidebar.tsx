import Link from "next/link";
import styles from "./Sidebar.module.css";

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <nav aria-label="Dashboard">
        <ul className={styles.list}>
          <li>
            <Link href="/dashboard" className={styles.link}>
              Dashboard
            </Link>
          </li>
          <li>
            <Link href="/" className={styles.link}>
              My bookings
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
