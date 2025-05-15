import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface MainContentProps {
  children: ReactNode;
  className?: string;
}

export default function MainContent({ children, className }: MainContentProps) {
  return (
    <main className={twMerge(
      "flex-1 max-w-[680px] mx-auto py-6",
      className
    )}>
      {children}
    </main>
  );
}
