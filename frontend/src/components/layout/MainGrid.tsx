import React from 'react';

interface MainGridProps {
  children: React.ReactNode;
}

export const MainGrid: React.FC<MainGridProps> = ({ children }) => {
  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto p-6">{children}</div>
    </div>
  );
};
