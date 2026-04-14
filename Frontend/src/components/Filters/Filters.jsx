import React, { useState } from 'react';
import './Filters.css';
import { useEffect, useState } from "react";


const [cuisines, setCuisines] = useState(["All"]);


useEffect(() => {
  const fetchCuisines = async () => {
    try {
      const res = await fetch(
        "/api/customer/restaurants/public-cuisines"
      );
      const data = await res.json();
       console.log("Fetched cuisines:", data.availableCuisines);
      setCuisines(["All", ...(data.cuisines || [])]);

    } catch (err) {
      console.error("Failed to load cuisines", err);
    }
  };
  fetchCuisines();
}, []);


const Filters = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    openNow: false,
    distance: 5,
    sortBy: 'rating',
    cuisine: 'italian',
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        [name]: type === 'number' ? parseInt(newValue, 10) : newValue
      };
      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  const handleCuisineClick = (cuisineId) => {
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        cuisine: cuisineId
      };
      onFilterChange(updatedFilters);
      return updatedFilters;
    });
  };

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label className="filter-toggle">
          <input
            type="checkbox"
            name="openNow"
            checked={filters.openNow}
            onChange={handleInputChange}
            className="toggle-input"
          />
          <span className="toggle-slider"></span>
          <span className="toggle-label">Open Now</span>
        </label>
      </div>

      <div className="filter-group">
        <label className="filter-label">Within Distance</label>
        <div className="slider-container">
          <input
            type="range"
            name="distance"
            min="1"
            max="20"
            value={filters.distance}
            onChange={handleInputChange}
            className="distance-slider"
          />
          <span className="distance-value">{filters.distance} km</span>
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label">Sort By</label>
        <select
          name="sortBy"
          value={filters.sortBy}
          onChange={handleInputChange}
          className="sort-select"
        >
          <option value="rating">Rating</option>
          <option value="distance">Distance</option>
          <option value="deliveryTime">Delivery Time</option>
          <option value="price">Price</option>
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label">Cuisine</label>
        <div className="cuisine-filters">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine.id}
              type="button"
              className={`cuisine-button ${filters.cuisine === cuisine.id ? 'active' : ''}`}
              onClick={() => handleCuisineClick(cuisine.id)}
            >
              {cuisine.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Filters;
