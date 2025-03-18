
import RoomList from "@/components/rooms/RoomList";

const RoomsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Rooms</h1>
      </div>
      <div className="space-y-6">
        <RoomList />
      </div>
    </div>
  );
};

export default RoomsPage;
