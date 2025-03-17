
import { MyBookings } from "@/components/bookings";

const BookingsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My Bookings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your upcoming and past bookings.
        </p>
      </div>
      <MyBookings />
    </div>
  );
};

export default BookingsPage;
