import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import Search from '../Search/Search';

describe('Search', () => {
  test('submits the user-entered search query', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();

    render(<Search onSearch={onSearch} />);

    await user.type(
      screen.getByPlaceholderText(/enter location or restaurant name/i),
      'Pune',
    );
    await user.click(screen.getByRole('button', { name: /search/i }));

    expect(onSearch).toHaveBeenCalledWith('Pune');
  });
});
