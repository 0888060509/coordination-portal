
import React, { useEffect, useState } from 'react';
import { useBooking } from '@/context/BookingContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from '@/types';
import { addDays, formatDate } from '@/utils/dateUtils';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RecurringOptions() {
  const { state, updateFormData, nextStep, prevStep, validateStep } = useBooking();
  const { formData, validationErrors } = state;
  
  const [endDate, setEndDate] = useState<Date | null>(
    formData.recurring_pattern?.end_date
      ? new Date(formData.recurring_pattern.end_date)
      : formData.start_time ? addDays(new Date(formData.start_time), 30) : null
  );
  
  const handleRecurringToggle = (checked: boolean) => {
    updateFormData({ is_recurring: checked });
  };
  
  const handleFrequencyChange = (value: string) => {
    updateFormData({
      recurring_pattern: {
        ...formData.recurring_pattern,
        frequency: value as 'daily' | 'weekly' | 'monthly',
      },
    });
  };
  
  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const interval = parseInt(e.target.value) || 1;
    updateFormData({
      recurring_pattern: {
        ...formData.recurring_pattern,
        interval,
      },
    });
  };
  
  const handleDayOfWeekChange = (day: number, checked: boolean) => {
    const currentDays = formData.recurring_pattern?.days_of_week || [];
    let newDays: number[] = [];
    
    if (checked) {
      newDays = [...currentDays, day].sort((a, b) => a - b);
    } else {
      newDays = currentDays.filter(d => d !== day);
    }
    
    updateFormData({
      recurring_pattern: {
        ...formData.recurring_pattern,
        days_of_week: newDays,
      },
    });
  };
  
  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date) {
      updateFormData({
        recurring_pattern: {
          ...formData.recurring_pattern,
          end_date: date.toISOString(),
          // Clear max occurrences when end date is set
          max_occurrences: undefined,
        },
      });
    }
  };
  
  const handleMaxOccurrencesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maxOccurrences = parseInt(e.target.value) || undefined;
    updateFormData({
      recurring_pattern: {
        ...formData.recurring_pattern,
        max_occurrences: maxOccurrences,
        // Clear end date when max occurrences is set
        end_date: undefined,
      },
    });
    setEndDate(null);
  };
  
  const handleNext = () => {
    if (validateStep(3)) {
      nextStep();
    }
  };
  
  // Initialize recurring pattern with defaults if not set
  useEffect(() => {
    if (formData.is_recurring && !formData.recurring_pattern && formData.start_time) {
      const startDate = new Date(formData.start_time);
      const dayOfWeek = startDate.getDay() || 7; // Convert 0 (Sunday) to 7 to match our 1-7 format
      
      updateFormData({
        recurring_pattern: {
          frequency: 'weekly',
          interval: 1,
          days_of_week: [dayOfWeek],
          end_date: addDays(startDate, 30).toISOString(),
        },
      });
    }
  }, [formData.is_recurring, formData.recurring_pattern, formData.start_time, updateFormData]);
  
  // Generate recurrence description
  const getRecurrenceDescription = (): string => {
    if (!formData.recurring_pattern) return '';
    
    const { frequency, interval, days_of_week, end_date, max_occurrences } = formData.recurring_pattern;
    
    let description = `Repeats ${frequency}`;
    
    if (interval && interval > 1) {
      description += ` every ${interval} ${
        frequency === 'daily' ? 'days' :
        frequency === 'weekly' ? 'weeks' : 'months'
      }`;
    }
    
    if (frequency === 'weekly' && days_of_week && days_of_week.length > 0) {
      const dayNames = days_of_week.map(day => 
        DAYS_OF_WEEK.find(d => d.value === day)?.label
      ).join(', ');
      
      description += ` on ${dayNames}`;
    }
    
    if (end_date) {
      description += ` until ${formatDate(end_date)}`;
    } else if (max_occurrences) {
      description += ` for ${max_occurrences} occurrences`;
    }
    
    return description;
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Step 4: Recurring Options</h2>
      
      <div className="flex items-center space-x-2">
        <Label htmlFor="is-recurring">Recurring Meeting?</Label>
        <Switch
          id="is-recurring"
          checked={formData.is_recurring || false}
          onCheckedChange={handleRecurringToggle}
        />
      </div>
      
      {formData.is_recurring && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={formData.recurring_pattern?.frequency || 'weekly'}
                  onValueChange={handleFrequencyChange}
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="interval">Repeat every</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="interval"
                    type="number"
                    min={1}
                    max={30}
                    value={formData.recurring_pattern?.interval || 1}
                    onChange={handleIntervalChange}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.recurring_pattern?.frequency === 'daily'
                      ? 'day(s)'
                      : formData.recurring_pattern?.frequency === 'weekly'
                      ? 'week(s)'
                      : 'month(s)'}
                  </span>
                </div>
              </div>
            </div>
            
            {formData.recurring_pattern?.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="flex flex-wrap gap-4">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`day-${day.value}`} 
                        checked={(formData.recurring_pattern?.days_of_week || []).includes(day.value)}
                        onCheckedChange={(checked) => 
                          handleDayOfWeekChange(day.value, checked === true)
                        }
                      />
                      <label 
                        htmlFor={`day-${day.value}`}
                        className="text-sm leading-none"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
                {validationErrors.days_of_week && (
                  <p className="text-sm font-medium text-destructive">{validationErrors.days_of_week}</p>
                )}
              </div>
            )}
            
            <Separator />
            
            <div className="space-y-4">
              <Label>End</Label>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span>On date:</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[240px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground",
                          formData.recurring_pattern?.max_occurrences && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={!!formData.recurring_pattern?.max_occurrences}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? formatDate(endDate) : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate || undefined}
                        onSelect={handleEndDateChange}
                        disabled={(date) => date < (formData.start_time ? new Date(formData.start_time) : new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-center gap-3">
                  <span>OR after</span>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.recurring_pattern?.max_occurrences || ''}
                    onChange={handleMaxOccurrencesChange}
                    disabled={!!endDate}
                    className="w-20"
                  />
                  <span>occurrences</span>
                </div>
              </div>
              
              {validationErrors.end_condition && (
                <p className="text-sm font-medium text-destructive">{validationErrors.end_condition}</p>
              )}
            </div>
            
            {formData.recurring_pattern && (
              <div className="bg-primary/10 p-3 rounded-md">
                <p className="font-medium">Summary:</p>
                <p className="text-sm">{getRecurrenceDescription()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
