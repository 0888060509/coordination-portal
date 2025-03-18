
import BookingsList from "@/components/bookings/BookingsList";

const BookingsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
      </div>
      <div className="space-y-6">
        <BookingsList />
      </div>
    </div>
  );
};

export default BookingsPage;
