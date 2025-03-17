
import React, { useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { BookingWithDetails } from '@/types/booking';

interface CalendarIntegrationProps {
  booking: BookingWithDetails;
}

const CalendarIntegration: React.FC<CalendarIntegrationProps> = ({ booking }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Helper function to format date for calendar links
  const formatCalendarDate = (date: string | Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  };
  
  // Create Google Calendar link
  const getGoogleCalendarLink = (): string => {
    const startTime = formatCalendarDate(booking.start_time);
    const endTime = formatCalendarDate(booking.end_time);
    const details = booking.description || '';
    const location = `${booking.room.name}, ${booking.room.location}${booking.room.floor ? `, Floor ${booking.room.floor}` : ''}`;
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(booking.title)}&dates=${startTime}/${endTime}&details=${encodeURIComponent(details)}&location=${encodeURIComponent(location)}`;
  };
  
  // Create Outlook Calendar link
  const getOutlookCalendarLink = (): string => {
    const startTime = new Date(booking.start_time).toISOString();
    const endTime = new Date(booking.end_time).toISOString();
    const subject = booking.title;
    const body = booking.description || '';
    const location = `${booking.room.name}, ${booking.room.location}${booking.room.floor ? `, Floor ${booking.room.floor}` : ''}`;
    
    return `https://outlook.office.com/calendar/0/deeplink/compose?subject=${encodeURIComponent(subject)}&startdt=${encodeURIComponent(startTime)}&enddt=${encodeURIComponent(endTime)}&body=${encodeURIComponent(body)}&location=${encodeURIComponent(location)}`;
  };
  
  // Generate ICS file
  const generateIcsFile = () => {
    setIsGenerating(true);
    
    try {
      const startTime = new Date(booking.start_time).toISOString().replace(/-|:|\.\d+/g, '');
      const endTime = new Date(booking.end_time).toISOString().replace(/-|:|\.\d+/g, '');
      const now = new Date().toISOString().replace(/-|:|\.\d+/g, '');
      const location = `${booking.room.name}, ${booking.room.location}${booking.room.floor ? `, Floor ${booking.room.floor}` : ''}`;
      
      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//MeetingMaster//RoomBooking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${booking.id}@meetingmaster.app`,
        `SUMMARY:${booking.title}`,
        `DTSTAMP:${now}`,
        `DTSTART:${startTime}`,
        `DTEND:${endTime}`,
        `DESCRIPTION:${booking.description || ''}`,
        `LOCATION:${location}`,
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');
      
      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `booking-${booking.id.substring(0, 8)}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Calendar file created",
        description: "Your .ics calendar file has been downloaded",
      });
    } catch (error) {
      console.error("Error generating ICS file:", error);
      toast({
        variant: "destructive",
        title: "Error creating calendar file",
        description: "There was a problem generating your calendar file.",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <h3 className="font-medium flex items-center">
        <Calendar className="h-4 w-4 mr-2" />
        Add to Calendar
      </h3>
      
      <div className="flex flex-wrap gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={() => window.open(getGoogleCalendarLink(), '_blank')}
              >
                Add to Google Calendar
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in Google Calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={() => window.open(getOutlookCalendarLink(), '_blank')}
              >
                Add to Outlook
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in Outlook Calendar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9"
                onClick={generateIcsFile}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-2" />
                Download .ics File
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Download calendar file (.ics)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default CalendarIntegration;
