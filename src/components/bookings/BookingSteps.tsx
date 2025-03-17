
import React from 'react';
import { useBookingContext } from '@/context/BookingContext';
import { cn } from "@/lib/utils";

const steps = [
  { title: 'Room & Time', description: 'Select room and time' },
  { title: 'Details', description: 'Meeting information' },
  { title: 'Attendees', description: 'Add participants' },
  { title: 'Recurring', description: 'Set repeat pattern' },
  { title: 'Confirm', description: 'Review and book' },
];

const BookingSteps = () => {
  const { state, goToStep } = useBookingContext();
  const { currentStep } = state;
  
  const handleStepClick = (index: number) => {
    // Only allow clicking on completed steps or the current step
    if (index <= currentStep) {
      goToStep(index);
    }
  };
  
  return (
    <div className="w-full py-4">
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 left-0 w-full h-[2px] bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
        </div>
        
        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className={cn(
                "flex flex-col items-center relative",
                index <= currentStep ? "cursor-pointer" : "cursor-not-allowed opacity-50"
              )}
              onClick={() => handleStepClick(index)}
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium z-10",
                  index < currentStep 
                    ? "bg-primary text-primary-foreground" 
                    : index === currentStep 
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20" 
                      : "bg-muted text-muted-foreground"
                )}
              >
                {index + 1}
              </div>
              <div className="text-xs font-medium mt-2 text-center">{step.title}</div>
              <div className="text-xs text-muted-foreground text-center">{step.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingSteps;
