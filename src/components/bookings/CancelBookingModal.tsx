
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cancelBooking, cancelRecurringBooking } from "@/services/bookingService";
import { toast } from "@/hooks/use-toast";

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
  bookingTitle: string;
  patternId?: string;
  onCancelled: () => void;
}

const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  bookingTitle,
  patternId,
  onCancelled,
}) => {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelType, setCancelType] = useState<"single" | "series">(
    patternId ? "single" : "single"
  );

  const handleCancel = async () => {
    try {
      setIsSubmitting(true);

      if (patternId && cancelType === "series") {
        // Cancel the entire recurring series
        await cancelRecurringBooking(patternId, true, undefined, reason);
        toast({
          title: "Series cancelled",
          description: "All recurring bookings in this series have been cancelled.",
        });
      } else {
        // Cancel just this instance
        await cancelBooking(bookingId, reason);
        toast({
          title: "Booking cancelled",
          description: "Your booking has been successfully cancelled.",
        });
      }

      onCancelled();
      onClose();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to cancel booking",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel {bookingTitle}?
          </DialogDescription>
        </DialogHeader>

        {patternId && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2">Cancel options:</h3>
            <RadioGroup
              value={cancelType}
              onValueChange={(value: "single" | "series") => setCancelType(value)}
            >
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="single" id="cancel-single" />
                <Label htmlFor="cancel-single">Cancel only this instance</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="series" id="cancel-series" />
                <Label htmlFor="cancel-series">Cancel the entire series</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="mb-4">
          <Label htmlFor="cancel-reason" className="mb-2 block">
            Reason for cancellation (optional):
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Please provide a reason for cancellation"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CancelBookingModal;
