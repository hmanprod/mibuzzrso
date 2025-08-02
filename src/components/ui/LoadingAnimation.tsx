import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  className?: string;
}

export const LoadingAnimation = ({ className }: LoadingAnimationProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-center w-full h-full',
        className,
      )}
    >
      <div className="spinning-dots">
        <div className="dot" />
        <div className="dot" />
        <div className="dot" />
      </div>
      <style jsx>{`
        .spinning-dots {
          display: flex;
          gap: 4px;
        }
        .dot {
          width: 6px;
          height: 6px;
          background-color: white;
          border-radius: 50%;
          animation: spin 1.4s infinite ease-in-out both;
        }
        .dot:nth-child(1) {
          animation-delay: -0.32s;
        }
        .dot:nth-child(2) {
          animation-delay: -0.16s;
        }
        @keyframes spin {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};
