import styles from './CheckoutSteps.module.css';

export function CheckoutSteps({ current = 'menu' }) {
  const steps = [
    { key: 'menu', label: 'Menu', icon: '🍽️' },
    { key: 'order', label: 'Cart & Reserve', icon: '🛒' },
    { key: 'payment', label: 'Payment', icon: '💳' },
    { key: 'placed', label: 'Order Placed', icon: '✅' },
    { key: 'feedback', label: 'Feedback', icon: '⭐' },
  ];

  const currentIdx = steps.findIndex((s) => s.key === current);

  return (
    <nav className={styles.stepsNav} aria-label="Checkout progress">
      <ol className={styles.stepsList}>
        {steps.map((s, idx) => {
          const isActive = s.key === current;
          const isCompleted = idx < currentIdx;
          const stepClass = [
            styles.stepItem,
            isActive ? styles.stepActive : '',
            isCompleted ? styles.stepCompleted : '',
          ].filter(Boolean).join(' ');

          return (
            <li key={s.key} className={stepClass}>
              <div className={styles.stepCircle}>
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span className={styles.stepIcon}>{s.icon}</span>
                )}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
              {idx < steps.length - 1 && (
                <div className={`${styles.connector} ${isCompleted ? styles.connectorCompleted : ''}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default CheckoutSteps;