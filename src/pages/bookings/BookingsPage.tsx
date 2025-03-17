
import { MyBookings } from "@/components/bookings";
import PageHeader from "@/components/common/PageHeader";

const BookingsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <PageHeader 
        title="My Bookings" 
        description="Manage your upcoming and past bookings."
      />
      <MyBookings />
    </div>
  );
};

export default BookingsPage;
