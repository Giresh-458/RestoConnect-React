import React from 'react';
import { useDispatch } from 'react-redux';
import { setSelectedRestaurant } from '../store/restaurantSlice';

const RestaurantCard = ({ restaurant }) => {
  const dispatch = useDispatch();

  const handleSelect = () => {
    dispatch(setSelectedRestaurant(restaurant));
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:scale-105"
      onClick={handleSelect}
    >
      <img 
        src={restaurant.imageUrl || '/images/image-not-found.jpg'} 
        alt={restaurant.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{restaurant.name}</h3>
        <div className="flex items-center text-gray-600 text-sm mb-2">
          <span className="mr-2">⭐ {restaurant.rating || 'N/A'}</span>
          <span>•</span>
          <span className="mx-2">{restaurant.cuisine || 'Various cuisines'}</span>
        </div>
        <p className="text-gray-700 text-sm line-clamp-2">
          {restaurant.description || 'A great place to enjoy delicious food.'}
        </p>
        <div className="mt-3 flex justify-between items-center">
          <span className="text-green-600 font-medium">
            {restaurant.priceRange || '₹₹₹'}
          </span>
          <span className="text-sm text-gray-500">
            {restaurant.distance ? `${restaurant.distance} miles away` : 'Nearby'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
