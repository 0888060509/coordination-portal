
import React from 'react';
import { useRooms } from '@/context/RoomContext';
import { formatDate } from '@/utils/dateUtils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const RoomFilters = () => {
  const { state, updateFilters, resetFilters } = useRooms();
  const { filters, allAmenities } = state;
  
  const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    updateFilters({ capacity: isNaN(value) ? 1 : value });
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ location: e.target.value });
  };
  
  const handleAmenityChange = (amenityId: string, checked: boolean) => {
    const currentAmenities = filters.amenities || [];
    let newAmenities;
    
    if (checked) {
      newAmenities = [...currentAmenities, amenityId];
    } else {
      newAmenities = currentAmenities.filter(id => id !== amenityId);
    }
    
    updateFilters({ amenities: newAmenities });
  };
  
  const handleSortChange = (value: string) => {
    const [sortBy, sortDirection] = value.split('-');
    // Only pass valid sortBy values that match the expected type
    const validSortBy = sortBy as "name" | "capacity" | "capacity_asc";
    updateFilters({ sortBy: validSortBy, sortDirection });
  };
  
  const handleReset = () => {
    resetFilters();
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Separator />
        
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min={1}
            value={filters.capacity || 1}
            onChange={handleCapacityChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="Search by location"
            value={filters.location || ''}
            onChange={handleLocationChange}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select 
            value={`${filters.sortBy}-${filters.sortDirection || 'asc'}`} 
            onValueChange={handleSortChange}
          >
            <SelectTrigger id="sort">
              <SelectValue placeholder="Select a sort option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="capacity-asc">Capacity (Low to High)</SelectItem>
              <SelectItem value="capacity-desc">Capacity (High to Low)</SelectItem>
              <SelectItem value="location-asc">Location (A-Z)</SelectItem>
              <SelectItem value="location-desc">Location (Z-A)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {allAmenities.length > 0 && (
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="space-y-2">
              {allAmenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity.id}`}
                    checked={(filters.amenities || []).includes(amenity.id)}
                    onCheckedChange={(checked) => 
                      handleAmenityChange(amenity.id, checked === true)
                    }
                  />
                  <Label htmlFor={`amenity-${amenity.id}`} className="cursor-pointer">
                    {amenity.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <Separator />
        
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {state.lastSearchTime && `Last search: ${formatDate(state.lastSearchTime)}`}
          </div>
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoomFilters;
