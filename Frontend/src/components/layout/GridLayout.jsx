import React from 'react';

const GridLayout = ({
  children,
  cols = { base: 1, sm: 2, lg: 3, xl: 4 },
  gap = 6,
  className = ''
}) => {
  const gridCols = {
    base: `grid-cols-${cols.base}`,
    sm: cols.sm ? `sm:grid-cols-${cols.sm}` : '',
    lg: cols.lg ? `lg:grid-cols-${cols.lg}` : '',
    xl: cols.xl ? `xl:grid-cols-${cols.xl}` : ''
  };

  return (
    <div className={`grid ${gridCols.base} ${gridCols.sm} ${gridCols.lg} ${gridCols.xl} gap-${gap} ${className}`}>
      {children}
    </div>
  );
};

export default GridLayout;
