
import React from "react";
import { UseFormReturn, FieldErrors } from "react-hook-form";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { RoomWithAmenities } from "@/types/room";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Calendar, Clock, MapPin, Users, CheckCircle, FileText, Tag } from "lucide-react";
import { parseTimeString } from "@/utils/formatUtils";

interface BookingReviewProps {
  form: UseFormReturn<any>;
  room: RoomWithAmenities;
  formErrors: FieldErrors<any>;
}

const BookingReview: React.FC<BookingReviewProps> = ({ form, room, formErrors }) => {
  const formValues = form.getValues();
  
  // Parse dates for display
  const bookingDate = formValues.date;
  const startDateTime = parseTimeString(formValues.startTime, bookingDate);
  const endDateTime = parseTimeString(formValues.endTime, bookingDate);
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Step 4: Review and Confirm</h2>
      
      {/* Room Details */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <h3 className="text-md font-medium mb-2">Room Details</h3>
        <div className="space-y-1">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span className="font-medium">{room.name}</span>
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-gray-500" />
            <span>Capacity: {room.capacity} people</span>
          </div>
          <div className="flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
            <span>Location: {room.location}{room.floor ? `, Floor ${room.floor}` : ''}</span>
          </div>
        </div>
      </div>
      
      {/* Meeting Details */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <h3 className="text-md font-medium mb-2">Meeting Details</h3>
        <div className="space-y-1">
          <div className="flex items-start">
            <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
            <div>
              <span className="font-medium">Title:</span> {formValues.title}
            </div>
          </div>
          
          {formValues.description && (
            <div className="flex items-start">
              <FileText className="h-4 w-4 mr-2 mt-0.5 text-gray-500" />
              <div>
                <span className="font-medium">Description:</span> {formValues.description}
              </div>
            </div>
          )}
          
          {formValues.meetingType && (
            <div className="flex items-center">
              <Tag className="h-4 w-4 mr-2 text-gray-500" />
              <span><span className="font-medium">Type:</span> {formValues.meetingType.charAt(0).toUpperCase() + formValues.meetingType.slice(1)}</span>
            </div>
          )}
          
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <span><span className="font-medium">Date:</span> {format(bookingDate, 'PPPP')}</span>
          </div>
          
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-500" />
            <span><span className="font-medium">Time:</span> {formValues.startTime} - {formValues.endTime}</span>
          </div>
        </div>
      </div>
      
      {/* Attendees */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <h3 className="text-md font-medium mb-2">Attendees</h3>
        
        {((formValues.attendees?.length || 0) + (formValues.externalAttendees?.length || 0)) > 0 ? (
          <div className="space-y-2">
            {formValues.attendees?.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 mb-1 block">Internal:</span>
                <div className="flex flex-wrap gap-2">
                  {formValues.attendees.map((attendee: any) => (
                    <Badge key={attendee.id} variant="secondary">
                      <User className="h-3 w-3 mr-1" />
                      {attendee.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {formValues.externalAttendees?.length > 0 && (
              <div>
                <span className="text-sm text-gray-500 mb-1 block">External:</span>
                <div className="flex flex-wrap gap-2">
                  {formValues.externalAttendees.map((email: string) => (
                    <Badge key={email} variant="secondary">
                      <Mail className="h-3 w-3 mr-1" />
                      {email}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No attendees added</div>
        )}
      </div>
      
      {/* Equipment and Requests */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-md">
        <h3 className="text-md font-medium mb-2">Equipment & Special Requests</h3>
        
        {formValues.equipment?.length > 0 ? (
          <div className="mb-3">
            <span className="text-sm text-gray-500 mb-1 block">Equipment needed:</span>
            <div className="flex flex-wrap gap-2">
              {formValues.equipment.map((eq: string) => (
                <Badge key={eq} variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {eq.charAt(0).toUpperCase() + eq.slice(1)}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm mb-3">No equipment selected</div>
        )}
        
        {formValues.specialRequests ? (
          <div>
            <span className="text-sm text-gray-500 mb-1 block">Special requests:</span>
            <div className="text-sm p-2 bg-gray-100 dark:bg-gray-700 rounded">
              {formValues.specialRequests}
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-sm">No special requests</div>
        )}
      </div>
      
      <Separator />
      
      {/* Terms and Conditions */}
      <FormField
        control={form.control}
        name="termsAccepted"
        render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                I agree to the terms and conditions for room bookings
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )}
      />
    </div>
  );
};

export default BookingReview;
