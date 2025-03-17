
import React from 'react';
import { 
  Wifi, Monitor, Coffee, Video, Phone, Music, 
  Pencil, BookOpen, PenTool, Stethoscope, Users,
  Thermometer, Lock, Plug, PlugZap, Lightbulb,
  Clock, VolumeX, Globe, Printer, Mic, Fan, 
} from 'lucide-react';
import { Amenity } from '@/types/index';

interface RoomAmenitiesProps {
  amenities: Amenity[];
}

// Map of amenity names to icons
const amenityIcons: Record<string, React.ReactNode> = {
  'wifi': <Wifi />,
  'projector': <Monitor />,
  'coffee': <Coffee />,
  'video-conference': <Video />,
  'phone': <Phone />,
  'sound-system': <Music />,
  'whiteboard': <Pencil />,
  'notebooks': <BookOpen />,
  'markers': <PenTool />,
  'medical-equipment': <Stethoscope />,
  'catering': <Coffee />,
  'handicap-accessible': <Users />,
  'climate-control': <Thermometer />,
  'secure-access': <Lock />,
  'power-outlets': <Plug />,
  'charging-station': <PlugZap />,
  'adjustable-lighting': <Lightbulb />,
  'timer': <Clock />,
  'soundproof': <VolumeX />,
  'internet': <Globe />,
  'printer': <Printer />,
  'microphone': <Mic />,
  'ventilation': <Fan />,
};

// Categories for grouping amenities
const amenityCategories = {
  'Technology': [
    'wifi', 'projector', 'video-conference', 'phone', 'sound-system', 
    'internet', 'printer', 'microphone', 'charging-station', 'power-outlets'
  ],
  'Comfort': [
    'climate-control', 'adjustable-lighting', 'soundproof', 'ventilation',
    'handicap-accessible'
  ],
  'Equipment': [
    'whiteboard', 'notebooks', 'markers', 'medical-equipment', 'timer'
  ],
  'Services': [
    'coffee', 'catering', 'secure-access'
  ]
};

const RoomAmenities = ({ amenities }: RoomAmenitiesProps) => {
  // If no amenities provided
  if (!amenities.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No amenities listed for this room.
        </p>
      </div>
    );
  }

  // Group amenities by category
  const categorizedAmenities: Record<string, Amenity[]> = {};
  const uncategorizedAmenities: Amenity[] = [];

  amenities.forEach(amenity => {
    let found = false;
    
    // Check if amenity belongs to a category
    for (const [category, amenityNames] of Object.entries(amenityCategories)) {
      const amenityName = amenity.name.toLowerCase();
      
      if (amenityNames.some(name => amenityName.includes(name))) {
        if (!categorizedAmenities[category]) {
          categorizedAmenities[category] = [];
        }
        categorizedAmenities[category].push(amenity);
        found = true;
        break;
      }
    }
    
    // If no category matches, add to uncategorized
    if (!found) {
      uncategorizedAmenities.push(amenity);
    }
  });

  // If there are uncategorized amenities, add them as a category
  if (uncategorizedAmenities.length) {
    categorizedAmenities['Other'] = uncategorizedAmenities;
  }

  // Function to get an icon for an amenity
  const getAmenityIcon = (amenity: Amenity) => {
    const amenityName = amenity.name.toLowerCase();
    
    // Search for matching icon by checking if the amenity name contains any of the icon keys
    for (const [key, icon] of Object.entries(amenityIcons)) {
      if (amenityName.includes(key)) {
        return icon;
      }
    }
    
    // If icon exists in the database, return null to render the name only
    return null;
  };

  return (
    <div className="space-y-8">
      {Object.entries(categorizedAmenities).map(([category, categoryAmenities]) => (
        <div key={category}>
          <h3 className="text-xl font-semibold mb-4">{category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categoryAmenities.map(amenity => {
              const icon = getAmenityIcon(amenity);
              
              return (
                <div key={amenity.id} className="flex items-center p-3 rounded-md border bg-white dark:bg-gray-800">
                  {icon && (
                    <div className="mr-3 text-gray-500 dark:text-gray-400">
                      {icon}
                    </div>
                  )}
                  <span className="text-sm font-medium">{amenity.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RoomAmenities;
