import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, SlidersHorizontal, LayoutGrid, LayoutList } from 'lucide-react';
import { Amenity, RoomFilterOptions } from '@/types/index';

interface RoomFiltersProps {
  amenities: Amenity[];
  locations: string[];
  selectedAmenities: string[];
  selectedLocation: string;
  onFilterChange: (filters: Partial<RoomFilterOptions>) => void;
  onToggleAmenity: (amenityId: string) => void;
  onResetFilters: () => void;
  viewType: 'grid' | 'list';
  onViewTypeChange: (viewType: 'grid' | 'list') => void;
}

const RoomFilters = ({
  amenities,
  locations,
  selectedAmenities,
  selectedLocation,
  onFilterChange,
  onToggleAmenity,
  onResetFilters,
  viewType,
  onViewTypeChange
}: RoomFiltersProps) => {
  const [sortBy, setSortBy] = useState<'name' | 'capacity' | 'capacity_asc'>('name');

  const handleSortChange = (value: string) => {
    const typedValue = value as 'name' | 'capacity' | 'capacity_asc';
    setSortBy(typedValue);
    onFilterChange({ sortBy: typedValue });
  };

  const handleLocationChange = (value: string) => {
    onFilterChange({ location: value === '_all' ? undefined : value });
  };

  const ViewToggle = () => (
    <div className="flex border rounded-md overflow-hidden">
      <Button
        variant={viewType === 'grid' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none"
        onClick={() => onViewTypeChange('grid')}
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
      <Button
        variant={viewType === 'list' ? 'default' : 'ghost'}
        size="sm"
        className="rounded-none"
        onClick={() => onViewTypeChange('list')}
      >
        <LayoutList className="h-4 w-4" />
      </Button>
    </div>
  );
  
  const DesktopFilters = () => (
    <div className="hidden md:flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-3 rounded-md mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Location:</span>
          <Select value={selectedLocation} onValueChange={handleLocationChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Sort by:</span>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="capacity">Capacity (High-Low)</SelectItem>
              <SelectItem value="capacity_asc">Capacity (Low-High)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Amenities
              {selectedAmenities.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                  {selectedAmenities.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filter by Amenities</h4>
                <p className="text-sm text-muted-foreground">
                  Select the amenities you need for your meeting
                </p>
              </div>
              <div className="grid gap-2 max-h-60 overflow-y-auto">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`desktop-amenity-${amenity.id}`}
                      checked={selectedAmenities.includes(amenity.id)}
                      onCheckedChange={() => onToggleAmenity(amenity.id)}
                    />
                    <label 
                      htmlFor={`desktop-amenity-${amenity.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity.name}
                    </label>
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onResetFilters}
                disabled={selectedAmenities.length === 0 && selectedLocation === '_all'}
              >
                Reset Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      <ViewToggle />
    </div>
  );
  
  const MobileFilters = () => (
    <div className="md:hidden flex items-center justify-between mb-4">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" size="sm">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters & Sort
            {(selectedAmenities.length > 0 || selectedLocation !== '_all') && (
              <span className="ml-1 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                {selectedAmenities.length + (selectedLocation !== '_all' ? 1 : 0)}
              </span>
            )}
          </Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Filter & Sort Rooms</DrawerTitle>
            <DrawerDescription>
              Customize your room search results
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 py-2 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Select value={selectedLocation} onValueChange={handleLocationChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All locations</SelectItem>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort by</label>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="capacity">Capacity (High-Low)</SelectItem>
                  <SelectItem value="capacity_asc">Capacity (Low-High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Amenities</label>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {amenities.map((amenity) => (
                  <div key={amenity.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`mobile-amenity-${amenity.id}`}
                      checked={selectedAmenities.includes(amenity.id)}
                      onCheckedChange={() => onToggleAmenity(amenity.id)}
                    />
                    <label 
                      htmlFor={`mobile-amenity-${amenity.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={() => {
              onFilterChange({});
            }}>
              Apply Filters
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" onClick={onResetFilters}>
                Reset Filters
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      
      <ViewToggle />
    </div>
  );
  
  return (
    <>
      <DesktopFilters />
      <MobileFilters />
    </>
  );
};

export default RoomFilters;
