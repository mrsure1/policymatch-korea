import { ReactNode } from 'react';

interface SiteShellProps {
  children: ReactNode;
  className?: string;
  centered?: boolean;
}

export default function SiteShell({ children, className = '', centered = false }: SiteShellProps) {
  return (
    <div className={`site-page text-[var(--ink)] ${className}`}>
      <div className={centered ? 'min-h-screen flex items-center justify-center p-4 sm:p-6' : ''}>
        {children}
      </div>
    </div>
  );
}
