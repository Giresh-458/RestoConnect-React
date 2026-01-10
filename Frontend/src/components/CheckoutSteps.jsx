import styles from './CheckoutSteps.module.css';

export function CheckoutSteps({ current = 'menu' }) {
  const steps = [
    { key: 'menu', label: 'Menu' },
    { key: 'order', label: 'Cart & Reservation' },
    { key: 'payment', label: 'Payment' },
    { key: 'placed', label: 'Order Placed' },
    { key: 'feedback', label: 'Feedback' },
  ];

  return (
    <nav className={styles.stepsNav} aria-label="Checkout progress">
      <ol className={styles.stepsList}>
        {steps.map((s, idx) => {
          const active = s.key === current;
          return (
            <li key={s.key} className={styles.stepItem}>
              <span
                className={`${styles.chip} ${active ? styles.chipActive : ''}`}
                aria-current={active ? 'step' : undefined}
              >
                {s.label}
              </span>
              {idx < steps.length - 1 && (
                <span className={styles.divider} aria-hidden="true">›</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutSteps;