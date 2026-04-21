import { render, screen } from '@testing-library/react';
import CheckoutSteps from '../components/CheckoutSteps';

describe('CheckoutSteps', () => {
  test('renders the full checkout flow and marks earlier steps as completed', () => {
    const { container } = render(<CheckoutSteps current="payment" />);

    expect(
      screen.getByRole('navigation', { name: /checkout progress/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Menu')).toBeInTheDocument();
    expect(screen.getByText('Cart & Reserve')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Order Placed')).toBeInTheDocument();
    expect(container.querySelectorAll('polyline')).toHaveLength(2);
  });

  test('shows no completed check marks when the first step is active', () => {
    const { container } = render(<CheckoutSteps current="menu" />);

    expect(container.querySelectorAll('polyline')).toHaveLength(0);
    expect(screen.getByText('Feedback')).toBeInTheDocument();
  });
});
