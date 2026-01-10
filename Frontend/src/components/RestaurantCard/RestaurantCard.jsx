import React from 'react';
import { Link } from 'react-router-dom';
import './RestaurantCard.css';

const RestaurantCard = ({ restaurant }) => {
  const { id, name, image, rating, deliveryTime, isOpen, cuisine } = restaurant;

  return (
    <Link to={`/restaurant/${id}`} className="restaurant-card">
      <div className="card-image-container">
        <img src={image} alt={name} className="restaurant-image" />
        <div className={`status-badge ${isOpen ? 'open' : 'closed'}`}>
          {isOpen ? 'Open' : 'Closed'}
        </div>
      </div>
      <div className="card-content">
        <h3 className="restaurant-name">{name}</h3>
        <div className="restaurant-details">
          <div className="rating">
            <span className="star">★</span> {rating.toFixed(1)}
          </div>
          <span className="cuisine">{cuisine}</span>
          <span className="delivery-time">{deliveryTime} min</span>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
