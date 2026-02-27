import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRestaurants, clearError } from '../store/restaurantSlice';
import RestaurantCard from '../components/RestaurantCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/layout/PageHeader';
import GridLayout from '../components/layout/GridLayout';
import { useToast } from '../components/common/Toast';

const RestaurantListPage = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const { items: restaurants, loading, error } = useSelector((state) => state.restaurants);

  useEffect(() => {
    dispatch(fetchRestaurants());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(`Error: ${error}`);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  if (loading) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader 
        title="Discover Restaurants" 
        className="text-center mb-8" 
      />
      
      <GridLayout>
        {restaurants.length > 0 ? (
          restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))
        ) : (
          <EmptyState 
            title="No restaurants found"
            description="We couldn't find any restaurants at the moment. Please check back later."
            className="col-span-full"
          />
        )}
      </GridLayout>
    </div>
  );
};

export default RestaurantListPage;
