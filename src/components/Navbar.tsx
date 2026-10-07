import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Main">
        <Link href="/" className={styles.brand}>
          Cospace
        </Link>
      </nav>
    </header>
  );
}
