
import React from "react";
import { UseFormReturn, FieldErrors } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface MeetingDetailsFormProps {
  form: UseFormReturn<any>;
  formErrors: FieldErrors<any>;
}

const MeetingDetailsForm: React.FC<MeetingDetailsFormProps> = ({ form, formErrors }) => {
  const meetingTypes = [
    { value: "regular", label: "Regular Meeting" },
    { value: "interview", label: "Interview" },
    { value: "training", label: "Training Session" },
    { value: "presentation", label: "Presentation" },
    { value: "workshop", label: "Workshop" },
    { value: "conference", label: "Conference" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Step 2: Meeting Details</h2>

      <div className="space-y-4">
        {/* Meeting Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Title <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter meeting title" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Meeting Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter meeting description" 
                  className="min-h-[100px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Meeting Type */}
        <FormField
          control={form.control}
          name="meetingType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meeting Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select meeting type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {meetingTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default MeetingDetailsForm;
