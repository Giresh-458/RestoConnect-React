import React from 'react';

const PageHeader = ({
  title,
  subtitle,
  action,
  className = '',
  titleClassName = 'text-3xl font-bold',
  subtitleClassName = 'mt-2 text-gray-600'
}) => {
  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between mb-8 ${className}`}>
      <div>
        <h1 className={titleClassName}>{title}</h1>
        {subtitle && <p className={subtitleClassName}>{subtitle}</p>}
      </div>
      {action && <div className="mt-4 md:mt-0">{action}</div>}
    </div>
  );
};

export default PageHeader;
