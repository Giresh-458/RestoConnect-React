import React, { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import './Search.css';

const Search = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <div className="search-container">
      <div className="search-content">
        <h1>Find your perfect meal nearby</h1>
        <p>Discover the best local restaurants and get your favorite food delivered to your door.</p>
        <form className="search-form" onSubmit={handleSubmit}>
          <div className="search-input-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Enter location or restaurant name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <button type="submit" className="search-button">
            Search
          </button>
        </form>
      </div>
    </div>
  );
};

export default Search;
