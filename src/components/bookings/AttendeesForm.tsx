
import React, { useState, useEffect } from "react";
import { UseFormReturn, FieldErrors } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, User, Mail } from "lucide-react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getAvailableUsers } from "@/services/bookingService";

interface AttendeesFormProps {
  form: UseFormReturn<any>;
  formErrors: FieldErrors<any>;
}

const AttendeesForm: React.FC<AttendeesFormProps> = ({ form, formErrors }) => {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  
  // Equipment options
  const equipmentOptions = [
    { id: "projector", label: "Projector" },
    { id: "whiteboard", label: "Whiteboard" },
    { id: "videoconference", label: "Video Conference System" },
    { id: "speakerphone", label: "Speaker Phone" },
    { id: "laptop", label: "Laptop" },
    { id: "catering", label: "Catering Services" }
  ];
  
  // Get available users for attendees
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => getAvailableUsers(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Handle adding external attendee
  const handleAddExternalAttendee = () => {
    if (!externalEmail) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(externalEmail)) {
      return;
    }
    
    const currentExternalAttendees = form.getValues('externalAttendees') || [];
    
    // Check if already added
    if (currentExternalAttendees.includes(externalEmail)) {
      setExternalEmail('');
      return;
    }
    
    form.setValue('externalAttendees', [...currentExternalAttendees, externalEmail]);
    setExternalEmail('');
  };
  
  // Handle removing external attendee
  const handleRemoveExternalAttendee = (email: string) => {
    const currentExternalAttendees = form.getValues('externalAttendees') || [];
    form.setValue(
      'externalAttendees', 
      currentExternalAttendees.filter(e => e !== email)
    );
  };
  
  // Handle adding internal attendee
  const handleSelectUser = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    if (!user) return;
    
    const currentAttendees = form.getValues('attendees') || [];
    
    // Check if already added
    if (currentAttendees.some(a => a.id === user.id)) {
      setOpen(false);
      return;
    }
    
    form.setValue('attendees', [
      ...currentAttendees, 
      {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        email: user.email,
        isExternal: false
      }
    ]);
    
    setOpen(false);
  };
  
  // Handle removing internal attendee
  const handleRemoveAttendee = (userId: string) => {
    const currentAttendees = form.getValues('attendees') || [];
    form.setValue(
      'attendees', 
      currentAttendees.filter(a => a.id !== userId)
    );
  };
  
  // Handle equipment change
  const handleEquipmentChange = (id: string, checked: boolean) => {
    const currentEquipment = form.getValues('equipment') || [];
    
    if (checked) {
      form.setValue('equipment', [...currentEquipment, id]);
    } else {
      form.setValue('equipment', currentEquipment.filter(e => e !== id));
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium">Step 3: Attendees and Resources</h2>
      
      <div className="space-y-6">
        {/* Internal Attendees */}
        <div className="space-y-2">
          <FormLabel>Attendees</FormLabel>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <User className="mr-2 h-4 w-4" />
                <span>Add Attendees</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start" side="bottom">
              <Command>
                <CommandInput 
                  placeholder="Search users..." 
                  value={searchValue}
                  onValueChange={setSearchValue}
                />
                <CommandList>
                  <CommandEmpty>No users found.</CommandEmpty>
                  <CommandGroup>
                    {users?.filter(user => 
                      `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchValue.toLowerCase()) ||
                      user.email.toLowerCase().includes(searchValue.toLowerCase())
                    ).map(user => (
                      <CommandItem
                        key={user.id}
                        value={user.id}
                        onSelect={handleSelectUser}
                      >
                        <User className="mr-2 h-4 w-4" />
                        <span>{user.first_name} {user.last_name}</span>
                        <span className="ml-2 text-sm text-gray-500">({user.email})</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <div className="mt-2">
            {(form.getValues('attendees') || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.getValues('attendees') || []).map((attendee: any) => (
                  <Badge key={attendee.id} variant="secondary" className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {attendee.name}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveAttendee(attendee.id)}
                      className="ml-1 rounded-full hover:bg-gray-300/20 p-1"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* External Attendees */}
        <div className="space-y-2">
          <FormLabel>External Attendees</FormLabel>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter email address"
              value={externalEmail}
              onChange={(e) => setExternalEmail(e.target.value)}
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleAddExternalAttendee}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-2">
            {(form.getValues('externalAttendees') || []).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.getValues('externalAttendees') || []).map((email: string) => (
                  <Badge key={email} variant="secondary" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {email}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveExternalAttendee(email)}
                      className="ml-1 rounded-full hover:bg-gray-300/20 p-1"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Equipment */}
        <div className="space-y-3">
          <FormLabel>Equipment Needed</FormLabel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {equipmentOptions.map((item) => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`equipment-${item.id}`} 
                  checked={(form.getValues('equipment') || []).includes(item.id)}
                  onCheckedChange={(checked) => 
                    handleEquipmentChange(item.id, checked as boolean)
                  }
                />
                <label 
                  htmlFor={`equipment-${item.id}`}
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {item.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        {/* Special Requests */}
        <FormField
          control={form.control}
          name="specialRequests"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Requests</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any special requirements for this booking?" 
                  className="min-h-[80px]" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

export default AttendeesForm;
