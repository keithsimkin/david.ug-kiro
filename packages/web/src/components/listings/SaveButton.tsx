import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '../ui/button';
import { useSavedListings } from '../../hooks/useSavedListings';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SaveButtonProps {
  listingId: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg';
  showText?: boolean;
  className?: string;
}

export const SaveButton = ({ 
  listingId, 
  variant = 'ghost', 
  size = 'sm',
  showText = false,
  className = ''
}: SaveButtonProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isListingSaved, toggleSave } = useSavedListings();
  const [isLoading, setIsLoading] = useState(false);
  const isSaved = isListingSaved(listingId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsLoading(true);
      await toggleSave(listingId);
    } catch (error) {
      console.error('Error toggling save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
      title={isSaved ? 'Remove from saved' : 'Save listing'}
    >
      <Heart
        className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`}
      />
      {showText && (
        <span className="ml-2">
          {isSaved ? 'Saved' : 'Save'}
        </span>
      )}
    </Button>
  );
};
