import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // The auth state change listener in AuthContext will handle the session
    // Just redirect to home after a brief moment
    const timer = setTimeout(() => {
      navigate('/');
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
};
