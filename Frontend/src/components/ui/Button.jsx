import React from 'react';
import '../../styles/theme.css';

export default function Button({ variant = 'primary', children, className = '', ...props }) {
  const mode = variant === 'primary' ? 'rc-btn-primary' : variant === 'secondary' ? 'rc-btn-secondary' : 'rc-btn-ghost';
  return (
    <button className={`rc-btn ${mode} ${className}`} {...props}>
      {children}
    </button>
  );
}
