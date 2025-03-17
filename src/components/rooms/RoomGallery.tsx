
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Mock images for testing - in a real app, these would come from the database
const mockImages = [
  '/placeholder.svg',
  '/placeholder.svg',
  '/placeholder.svg',
];

interface RoomGalleryProps {
  imageUrl?: string;
  roomName: string;
  additionalImages?: string[];
}

const RoomGallery = ({ 
  imageUrl, 
  roomName, 
  additionalImages = [] 
}: RoomGalleryProps) => {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Combine the main image with additional images, or use mock images if none provided
  const allImages = imageUrl 
    ? [imageUrl, ...additionalImages]
    : (additionalImages.length > 0 ? additionalImages : mockImages);

  const handleFullscreen = () => {
    setFullscreenOpen(true);
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
      {/* Main Carousel */}
      <Carousel>
        <CarouselContent>
          {allImages.map((image, index) => (
            <CarouselItem key={index}>
              <div className="relative aspect-video w-full">
                <img
                  src={image}
                  alt={`${roomName} - Image ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="h-8 w-8 -left-2" />
        <CarouselNext className="h-8 w-8 -right-2" />
        
        {/* Fullscreen button */}
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-4 right-4 rounded-full opacity-80 hover:opacity-100"
          onClick={handleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </Carousel>

      {/* Thumbnail navigation */}
      {allImages.length > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              className={cn(
                "w-16 h-10 rounded-md overflow-hidden border-2 transition-all",
                index === currentIndex
                  ? "border-primary"
                  : "border-transparent opacity-70 hover:opacity-100"
              )}
              onClick={() => setCurrentIndex(index)}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen dialog */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="max-w-5xl w-[90vw] h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white bg-black/50 hover:bg-black/70"
              onClick={() => setFullscreenOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 z-10 text-white bg-black/50 hover:bg-black/70"
              onClick={handlePrevious}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            
            <img
              src={allImages[currentIndex]}
              alt={`${roomName} - Full View`}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                e.currentTarget.src = '/placeholder.svg';
              }}
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 z-10 text-white bg-black/50 hover:bg-black/70"
              onClick={handleNext}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {currentIndex + 1} / {allImages.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomGallery;
