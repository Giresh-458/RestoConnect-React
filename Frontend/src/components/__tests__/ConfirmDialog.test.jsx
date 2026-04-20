import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmProvider, useConfirm } from '../common/ConfirmDialog';

function ConfirmHarness() {
  const confirm = useConfirm();
  const [result, setResult] = useState('idle');

  const openDialog = async () => {
    const confirmed = await confirm({
      title: 'Delete order?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Keep',
      variant: 'danger',
    });

    setResult(confirmed ? 'confirmed' : 'cancelled');
  };

  return (
    <>
      <button type="button" onClick={openDialog}>
        Open confirm
      </button>
      <span>{result}</span>
    </>
  );
}

describe('ConfirmDialog', () => {
  test('resolves true when the user confirms the action', async () => {
    const user = userEvent.setup();

    render(
      <ConfirmProvider>
        <ConfirmHarness />
      </ConfirmProvider>,
    );

    await user.click(screen.getByRole('button', { name: /open confirm/i }));

    expect(screen.getByText(/delete order\?/i)).toBeInTheDocument();
    expect(screen.getByText(/this action cannot be undone\./i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(await screen.findByText('confirmed')).toBeInTheDocument();
  });

  test('resolves false when the user cancels the action', async () => {
    const user = userEvent.setup();

    render(
      <ConfirmProvider>
        <ConfirmHarness />
      </ConfirmProvider>,
    );

    await user.click(screen.getByRole('button', { name: /open confirm/i }));
    await user.click(screen.getByRole('button', { name: /keep/i }));

    expect(await screen.findByText('cancelled')).toBeInTheDocument();
  });
});
