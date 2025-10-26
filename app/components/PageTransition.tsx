'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="animate-fadeIn"
      style={{
        animation: 'fadeIn 0.2s ease-in-out'
      }}
    >
      {children}
    </div>
  );
}
