// src/components/ResponsiveContainer.tsx
import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 mx-auto max-w-7xl ${className}`}>
      {children}
    </div>
  );
}