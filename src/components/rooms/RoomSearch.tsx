
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface RoomSearchProps {
  onSearchChange: (query: string) => void;
}

const RoomSearch: React.FC<RoomSearchProps> = ({ onSearchChange }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange(query);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search rooms by name, location..."
        className="pl-10 pr-4 py-2 w-full md:w-80"
        value={searchQuery}
        onChange={handleSearch}
      />
    </div>
  );
};

export default RoomSearch;
