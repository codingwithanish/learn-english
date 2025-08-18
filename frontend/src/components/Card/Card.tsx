import React from 'react';
import { 
  BookOpenIcon, 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  StarIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { TextResource, ResourceType } from '@/types';

interface CardProps {
  resource: TextResource;
  onClick?: (resource: TextResource) => void;
  onFavorite?: (resource: TextResource) => void;
  showFavorite?: boolean;
  showTimestamp?: boolean;
  className?: string;
}

const Card: React.FC<CardProps> = ({ 
  resource, 
  onClick, 
  onFavorite, 
  showFavorite = true,
  showTimestamp = false,
  className = ""
}) => {
  if (!resource) return null;

  const getTypeIcon = (type: ResourceType | string): React.ReactNode => {
    switch (type?.toUpperCase()) {
      case 'VOCABULARY':
        return <BookOpenIcon className="h-5 w-5" />;
      case 'PHRASE':
        return <ChatBubbleLeftRightIcon className="h-5 w-5" />;
      case 'GRAMMAR':
        return <AcademicCapIcon className="h-5 w-5" />;
      default:
        return <BookOpenIcon className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: ResourceType | string): string => {
    switch (type?.toUpperCase()) {
      case 'VOCABULARY':
        return 'text-blue-600 bg-blue-100';
      case 'PHRASE':
        return 'text-green-600 bg-green-100';
      case 'GRAMMAR':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCardClick = (): void => {
    if (onClick) {
      onClick(resource);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    if (onFavorite) {
      onFavorite(resource);
    }
  };

  const renderStars = (rating: number): React.ReactNode[] => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    
    for (let i = 0; i < 5; i++) {
      stars.push(
        <StarIcon
          key={i}
          className={`h-4 w-4 ${i < fullStars ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return stars;
  };

  const type = resource.type;
  const content = resource.content;
  const description = resource.metadata?.topic || 'No description available';
  const rating = resource.rating || 0;
  const impressions = resource.usage_count || 0;
  const examples = resource.examples || [];
  const isFavorite = resource.is_favorite || false;

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 cursor-pointer p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className={`p-2 rounded-lg ${getTypeColor(type)}`}>
            {getTypeIcon(type)}
          </div>
          <div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${getTypeColor(type)}`}>
              {type}
            </span>
          </div>
        </div>
        
        {showFavorite && (
          <button
            onClick={handleFavoriteClick}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-5 w-5 text-red-500" />
            ) : (
              <HeartIcon className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="mb-3">
        <h3 className="text-lg font-medium text-gray-900 mb-1 line-clamp-2">
          {content}
        </h3>
        {description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Examples */}
      {examples && examples.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Examples:</h4>
          <div className="space-y-1">
            {examples.slice(0, 2).map((example, index) => (
              <p key={index} className="text-xs text-gray-500 italic">
                "{typeof example === 'string' ? example : example.sentence}"
              </p>
            ))}
            {examples.length > 2 && (
              <p className="text-xs text-gray-400">
                +{examples.length - 2} more examples
              </p>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-3">
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <div className="flex">{renderStars(rating)}</div>
            <span>({rating}/5)</span>
          </div>
          
          {/* Impressions */}
          <div className="flex items-center space-x-1">
            <EyeIcon className="h-4 w-4" />
            <span>{impressions}</span>
          </div>
        </div>
        
        {/* Timestamp */}
        {showTimestamp && resource.created_at && (
          <div>
            <span>
              {new Date(resource.created_at).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;