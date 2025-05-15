import { ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={twMerge(
      "max-w-[1440px] mx-auto px-4",
      className
    )}>
      <div className="flex">
        {children}
      </div>
    </div>
  );
}
