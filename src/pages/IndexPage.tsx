
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

const IndexPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  React.useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
            <span className="block">Welcome to</span>
            <span className="block text-primary">MeetingMaster</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Simplify your meeting room bookings with our powerful and intuitive platform. 
            Book rooms, manage schedules, and collaborate efficiently.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Button 
                onClick={() => navigate('/login')} 
                className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90 md:py-4 md:text-lg md:px-10"
              >
                Sign In
              </Button>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Button 
                onClick={() => navigate('/register')} 
                variant="outline"
                className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md border-primary text-primary bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
              >
                Register
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexPage;
