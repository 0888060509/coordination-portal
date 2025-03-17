
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, SearchIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFoundPage() {
  const navigate = useNavigate();
  
  const handleGoHome = () => {
    navigate('/');
  };
  
  const handleSearchRooms = () => {
    navigate('/rooms');
  };
  
  return (
    <div className="container flex items-center justify-center min-h-screen py-20">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6 text-center">
          <div className="flex flex-col items-center space-y-8">
            <SearchIcon className="w-20 h-20 text-primary" />
            
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">404</h1>
              <h2 className="text-2xl font-semibold">Page Not Found</h2>
              <p className="text-muted-foreground">
                The page you are looking for doesn't exist or has been moved.
              </p>
            </div>
            
            <div className="flex flex-col w-full space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button
                className="flex items-center justify-center w-full"
                onClick={handleGoHome}
              >
                <HomeIcon className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-center w-full"
                onClick={handleSearchRooms}
              >
                <SearchIcon className="w-4 h-4 mr-2" />
                Search Rooms
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
