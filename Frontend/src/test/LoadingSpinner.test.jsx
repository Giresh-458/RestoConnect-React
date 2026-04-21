import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/common/LoadingSpinner';

describe('LoadingSpinner', () => {
  test('renders the default medium spinner styles', () => {
    render(<LoadingSpinner />);

    expect(screen.getByLabelText(/loading/i)).toHaveClass(
      'h-12',
      'w-12',
      'border-t-2',
      'border-b-2',
    );
  });

  test('supports custom size and wrapper class names', () => {
    const { container } = render(<LoadingSpinner size="lg" className="mt-6" />);

    expect(container.firstChild).toHaveClass('mt-6');
    expect(screen.getByLabelText(/loading/i)).toHaveClass('h-16', 'w-16');
  });
});
