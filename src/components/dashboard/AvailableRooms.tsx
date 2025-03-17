
import { RoomWithAmenities } from "@/types/room";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AvailableRoomsProps {
  rooms: RoomWithAmenities[];
}

export function AvailableRooms({ rooms }: AvailableRoomsProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Room Availability</CardTitle>
        <CardDescription>
          Currently available meeting rooms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-2">No rooms available at this time</p>
              <Button
                variant="outline"
                onClick={() => navigate("/rooms")}
              >
                View All Rooms
              </Button>
            </div>
          ) : (
            <>
              {rooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/30 rounded-md">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="font-medium">{room.name}</span>
                    <span className="ml-2 text-xs text-gray-500">(Capacity: {room.capacity})</span>
                  </div>
                  <Button
                    size="sm"
                    className="bg-meeting-secondary hover:bg-teal-600"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    View
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => navigate("/rooms")}
              >
                View All Rooms
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
