import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RestaurantCard from '../RestaurantCard/RestaurantCard';

describe('RestaurantCard', () => {
  test('renders restaurant details and links to the menu page', () => {
    render(
      <MemoryRouter>
        <RestaurantCard
          restaurant={{
            id: 'rest-42',
            name: 'Spice Route',
            image: '/images/spice-route.jpg',
            rating: 4.26,
            deliveryTime: 30,
            isOpen: true,
            cuisine: 'Indian',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('img', { name: /spice route/i })).toHaveAttribute(
      'src',
      '/images/spice-route.jpg',
    );
    expect(screen.getByText('Open')).toBeInTheDocument();
    expect(screen.getByText(/4\.3/)).toBeInTheDocument();
    expect(screen.getByText('Indian')).toBeInTheDocument();
    expect(screen.getByText(/30 min/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /spice route/i })).toHaveAttribute(
      'href',
      '/restaurant/rest-42',
    );
  });
});
