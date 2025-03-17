
import React from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";

export interface RecurringOptions {
  isRecurring: boolean;
  frequency: "daily" | "weekly" | "monthly";
  interval: number;
  daysOfWeek: number[];
  endType: "date" | "occurrences" | "never";
  endDate?: Date;
  maxOccurrences?: number;
}

interface RecurringBookingOptionsProps {
  value: RecurringOptions;
  onChange: (value: RecurringOptions) => void;
  startDate: Date;
}

const RecurringBookingOptions: React.FC<RecurringBookingOptionsProps> = ({
  value,
  onChange,
  startDate,
}) => {
  const weekdays = [
    { label: "Mon", value: 1 },
    { label: "Tue", value: 2 },
    { label: "Wed", value: 3 },
    { label: "Thu", value: 4 },
    { label: "Fri", value: 5 },
    { label: "Sat", value: 6 },
    { label: "Sun", value: 7 },
  ];

  const handleEndTypeChange = (endType: string) => {
    onChange({
      ...value,
      endType: endType as "date" | "occurrences" | "never",
      ...(endType === "date" && !value.endDate ? { endDate: new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) } : {}),
      ...(endType === "occurrences" && !value.maxOccurrences ? { maxOccurrences: 10 } : {})
    });
  };

  const handleDayToggle = (day: number) => {
    const newDays = value.daysOfWeek.includes(day)
      ? value.daysOfWeek.filter(d => d !== day)
      : [...value.daysOfWeek, day];
    
    onChange({
      ...value,
      daysOfWeek: newDays
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="recurring-toggle">Make this a recurring meeting</Label>
        <Switch
          id="recurring-toggle"
          checked={value.isRecurring}
          onCheckedChange={(checked) => onChange({ ...value, isRecurring: checked })}
        />
      </div>

      {value.isRecurring && (
        <>
          <Separator />
          
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Frequency</Label>
              <RadioGroup
                defaultValue={value.frequency}
                onValueChange={(val) => onChange({ 
                  ...value, 
                  frequency: val as "daily" | "weekly" | "monthly",
                  // Initialize days of week if switching to weekly
                  daysOfWeek: val === "weekly" && value.daysOfWeek.length === 0 
                    ? [startDate.getDay() === 0 ? 7 : startDate.getDay()] 
                    : value.daysOfWeek
                })}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Label htmlFor="interval" className="min-w-32">Repeat every:</Label>
              <Input
                id="interval"
                type="number"
                min={1}
                max={30}
                value={value.interval}
                onChange={(e) => onChange({ ...value, interval: parseInt(e.target.value) || 1 })}
                className="w-20"
              />
              <span>{value.frequency === "daily" ? "days" : value.frequency === "weekly" ? "weeks" : "months"}</span>
            </div>

            {value.frequency === "weekly" && (
              <div className="space-y-2">
                <Label className="block">Repeat on:</Label>
                <div className="flex flex-wrap gap-2">
                  {weekdays.map((day) => (
                    <div key={day.value} className="flex items-center">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={value.daysOfWeek.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <label
                        htmlFor={`day-${day.value}`}
                        className="ml-2 text-sm font-medium cursor-pointer"
                      >
                        {day.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="block">End:</Label>
              <RadioGroup
                defaultValue={value.endType}
                onValueChange={handleEndTypeChange}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="never" id="end-never" />
                  <Label htmlFor="end-never">Never</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="occurrences" id="end-occurrences" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="end-occurrences">After</Label>
                    <Input
                      id="max-occurrences"
                      type="number"
                      min={1}
                      disabled={value.endType !== "occurrences"}
                      value={value.maxOccurrences || 10}
                      onChange={(e) => onChange({ ...value, maxOccurrences: parseInt(e.target.value) || 10 })}
                      className="w-20"
                    />
                    <span>occurrences</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="date" id="end-date" />
                  <Label htmlFor="end-date">On date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        disabled={value.endType !== "date"}
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !value.endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value.endDate ? format(value.endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={value.endDate}
                        onSelect={(date) => onChange({ ...value, endDate: date || undefined })}
                        disabled={(date) => date < startDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </RadioGroup>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default RecurringBookingOptions;
