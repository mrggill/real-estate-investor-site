// src/components/ResponsiveContainer.tsx
"use client";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
}

export default function ResponsiveContainer({ 
  children, 
  className = ""
}: ResponsiveContainerProps) {
  return (
    <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}