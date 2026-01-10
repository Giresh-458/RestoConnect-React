import React from 'react';

const EmptyState = ({
  title = 'No results found',
  description = 'There are no items to display at the moment.',
  icon: Icon,
  action,
  className = ''
}) => {
  return (
    <div className={`text-center py-10 ${className}`}>
      {Icon && <Icon className="mx-auto h-12 w-12 text-gray-400" />}
      <h3 className="mt-2 text-sm font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};

export default EmptyState;
