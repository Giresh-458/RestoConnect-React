import { act, fireEvent, render, screen } from '@testing-library/react';
import { ToastProvider, toast, useToast } from '../components/common/Toast';

function ToastHarness() {
  const notify = useToast();

  return (
    <button type="button" onClick={() => notify.success('Saved successfully')}>
      Show success
    </button>
  );
}

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  test('renders a toast triggered through the context hook and dismisses it automatically', () => {
    render(
      <ToastProvider>
        <ToastHarness />
      </ToastProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /show success/i }));
    });

    expect(screen.getByText('Saved successfully')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(screen.queryByText('Saved successfully')).not.toBeInTheDocument();
  });

  test('supports the global toast helper while a provider is mounted', () => {
    render(
      <ToastProvider>
        <div>Toast host</div>
      </ToastProvider>,
    );

    act(() => {
      toast.info('Inventory synced');
    });

    expect(screen.getByText('Inventory synced')).toBeInTheDocument();
  });
});
