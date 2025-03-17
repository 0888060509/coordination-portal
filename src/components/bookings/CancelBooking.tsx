
import React, { useState } from "react";
import { format } from "date-fns";
import { Calendar, Clock, AlertCircle } from "lucide-react";
import { BookingWithDetails } from "@/types/booking";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface CancelBookingProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingWithDetails;
  onConfirm: (reason: string) => void;
}

const CancelBooking: React.FC<CancelBookingProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>("");
  const [cancellationType, setCancellationType] = useState<string>("single");
  const startTime = new Date(booking.start_time);
  
  const handleConfirm = () => {
    onConfirm(reason);
  };
  
  // Only show recurring options if the booking has a recurring pattern
  const isRecurring = !!booking.recurring_pattern_id;
  
  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
          <AlertDialogDescription className="text-destructive">
            <AlertCircle className="h-5 w-5 inline-block mr-1" />
            This action cannot be undone. The room will become available for others to book.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-4">
          <div className="rounded-md bg-muted p-3 mb-4">
            <h3 className="font-semibold mb-1">{booking.title}</h3>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              {format(startTime, "MMMM d, yyyy")}
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-1" />
              {format(startTime, "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
            </div>
          </div>
          
          {isRecurring && (
            <>
              <div className="mb-4">
                <Label htmlFor="cancellationType">Cancellation Type</Label>
                <Select 
                  value={cancellationType} 
                  onValueChange={setCancellationType}
                >
                  <SelectTrigger id="cancellationType">
                    <SelectValue placeholder="Select a cancellation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Cancel this occurrence only</SelectItem>
                    <SelectItem value="future">Cancel this and all future occurrences</SelectItem>
                    <SelectItem value="all">Cancel all occurrences</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {cancellationType === "single" && "Only this specific booking will be cancelled."}
                  {cancellationType === "future" && "This booking and all future occurrences will be cancelled."}
                  {cancellationType === "all" && "All occurrences of this recurring booking will be cancelled."}
                </p>
              </div>
              <Separator className="my-4" />
            </>
          )}
          
          <div className="mb-4">
            <Label htmlFor="cancellationReason">Reason for Cancellation (Optional)</Label>
            <Textarea
              id="cancellationReason"
              placeholder="Please provide a reason for cancellation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This information will be included in the cancellation notifications sent to attendees.
            </p>
          </div>
          
          <div className="rounded-md bg-amber-50 dark:bg-amber-950 p-3 text-amber-800 dark:text-amber-300 text-sm">
            <p className="font-medium">Impact of Cancellation:</p>
            <ul className="list-disc list-inside mt-1">
              <li>The room will become available for others to book</li>
              <li>All attendees will be notified of the cancellation</li>
              <li>This booking will be moved to your cancelled bookings list</li>
            </ul>
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>No, keep booking</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Yes, cancel booking
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelBooking;
