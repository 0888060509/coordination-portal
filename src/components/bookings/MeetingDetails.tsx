
import React from 'react';
import { useBookingContext } from '@/context/BookingContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const MEETING_TYPES = [
  { value: 'interview', label: 'Interview' },
  { value: 'client_meeting', label: 'Client Meeting' },
  { value: 'team_meeting', label: 'Team Meeting' },
  { value: 'training', label: 'Training Session' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'presentation', label: 'Presentation' },
  { value: 'other', label: 'Other' },
];

const MeetingDetails = () => {
  const { state, updateFormData, nextStep, prevStep, validateStep } = useBookingContext();
  const { formData, validationErrors } = state;
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ title: e.target.value });
  };
  
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateFormData({ description: e.target.value });
  };
  
  const handleMeetingTypeChange = (value: string) => {
    updateFormData({ meeting_type: value });
  };
  
  const handleNext = () => {
    if (validateStep(1)) {
      nextStep();
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="required">Meeting Title</Label>
            <Input
              id="title"
              placeholder="Enter a title for your booking"
              value={formData.title || ''}
              onChange={handleTitleChange}
              maxLength={100}
              className={cn(
                validationErrors.title && "border-destructive"
              )}
            />
            {validationErrors.title ? (
              <p className="text-sm text-destructive mt-1">{validationErrors.title}</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {formData.title?.length || 0}/100 characters
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meeting-type">Meeting Type</Label>
            <Select
              value={formData.meeting_type || ''}
              onValueChange={handleMeetingTypeChange}
            >
              <SelectTrigger id="meeting-type">
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                {MEETING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add details about your meeting (optional)"
              value={formData.description || ''}
              onChange={handleDescriptionChange}
              rows={4}
            />
          </div>
          
          <div className="flex justify-between">
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
            <Button onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MeetingDetails;
