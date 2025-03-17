
import React, { useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { EQUIPMENT_OPTIONS } from '@/types';
import { Card, CardContent } from "@/components/ui/card";

export default function AttendeesResources() {
  const { state, updateFormData, nextStep, prevStep, validateStep } = useBooking();
  const { formData, validationErrors } = state;
  
  const [newAttendee, setNewAttendee] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  const handleAddAttendee = () => {
    if (!newAttendee.trim()) {
      return;
    }
    
    if (!validateEmail(newAttendee)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    const currentAttendees = formData.attendees || [];
    if (!currentAttendees.includes(newAttendee)) {
      updateFormData({ attendees: [...currentAttendees, newAttendee] });
    }
    
    setNewAttendee('');
    setEmailError('');
  };
  
  const handleRemoveAttendee = (email: string) => {
    const currentAttendees = formData.attendees || [];
    updateFormData({
      attendees: currentAttendees.filter((attendee) => attendee !== email),
    });
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAttendee();
    }
  };
  
  const handleEquipmentChange = (value: string, checked: boolean) => {
    const currentEquipment = formData.equipment_needed || [];
    
    if (checked) {
      updateFormData({ equipment_needed: [...currentEquipment, value] });
    } else {
      updateFormData({ 
        equipment_needed: currentEquipment.filter(item => item !== value) 
      });
    }
  };
  
  const handleSpecialRequestsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ special_requests: e.target.value });
  };
  
  const handleNext = () => {
    if (validateStep(2)) {
      nextStep();
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Step 3: Attendees and Resources</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="new-attendee">Attendees</Label>
          <div className="flex gap-2 mt-1.5">
            <Input
              id="new-attendee"
              placeholder="Add attendee email"
              value={newAttendee}
              onChange={(e) => {
                setNewAttendee(e.target.value);
                setEmailError('');
              }}
              onKeyDown={handleKeyDown}
              className={emailError ? "border-destructive" : ""}
            />
            <Button type="button" onClick={handleAddAttendee}>
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          {emailError && (
            <p className="text-sm font-medium text-destructive mt-1.5">{emailError}</p>
          )}
        </div>
        
        {(formData.attendees?.length || 0) > 0 && (
          <div>
            <p className="text-sm mb-2">Added attendees:</p>
            <div className="flex flex-wrap gap-2">
              {formData.attendees?.map((email) => (
                <Badge key={email} variant="secondary" className="flex items-center gap-1">
                  {email}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveAttendee(email)}
                    className="ml-1 rounded-full hover:bg-background/20 p-0.5"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove</span>
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="space-y-2">
          <Label>Equipment Needed</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {EQUIPMENT_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox 
                  id={`equipment-${option.value}`} 
                  checked={(formData.equipment_needed || []).includes(option.value)}
                  onCheckedChange={(checked) => 
                    handleEquipmentChange(option.value, checked === true)
                  }
                />
                <label 
                  htmlFor={`equipment-${option.value}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="special-requests">Special Requests</Label>
          <Input
            id="special-requests"
            placeholder="Any special requirements or arrangements"
            value={formData.special_requests || ''}
            onChange={handleSpecialRequestsChange}
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
    </div>
  );
}
