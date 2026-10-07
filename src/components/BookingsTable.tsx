import styles from "./BookingsTable.module.css";

export interface TableBooking {
  id: number;
  desk: string;
  floor: string;
  date: string;
  status: "Active" | "Inactive";
}

export default function BookingsTable({
  bookings,
}: {
  bookings: TableBooking[];
}) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>Desk bookings</caption>
      <thead>
        <tr>
          <th scope="col">Desk</th>
          <th scope="col">Floor</th>
          <th scope="col">Date</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((booking) => (
          <tr key={booking.id}>
            <th scope="row">{booking.desk}</th>
            <td>{booking.floor}</td>
            <td>
              <time dateTime={booking.date}>{booking.date}</time>
            </td>
            <td>{booking.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
