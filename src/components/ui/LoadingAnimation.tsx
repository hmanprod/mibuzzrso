import { cn } from '@/lib/utils';

interface LoadingAnimationProps {
  className?: string;
}

export const LoadingAnimation = ({ className }: LoadingAnimationProps) => {
  return (
    <div className={cn('relative w-full h-full', className)}>
      <div className="laudine-animation">
        <div className="head" />
        <div className="body">
          <div className="note-1" />
          <div className="note-2" />
        </div>
      </div>
      <style jsx>{`
        .laudine-animation {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: bounce 0.6s infinite alternate;
        }

        .head {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          margin-bottom: 2px;
        }

        .body {
          width: 10px;
          height: 14px;
          background: white;
          border-radius: 6px;
          position: relative;
        }

        .note-1, .note-2 {
          position: absolute;
          background: white;
          border-radius: 2px;
        }

        .note-1 {
          width: 8px;
          height: 2px;
          right: -8px;
          top: 2px;
          animation: float1 2s infinite;
        }

        .note-2 {
          width: 6px;
          height: 2px;
          left: -6px;
          bottom: 4px;
          animation: float2 2s infinite 0.5s;
        }

        @keyframes bounce {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2px);
          }
        }

        @keyframes float1 {
          0% {
            opacity: 0;
            transform: translate(0, 0);
          }
          50% {
            opacity: 1;
            transform: translate(5px, -5px);
          }
          100% {
            opacity: 0;
            transform: translate(10px, -10px);
          }
        }

        @keyframes float2 {
          0% {
            opacity: 0;
            transform: translate(0, 0);
          }
          50% {
            opacity: 1;
            transform: translate(-5px, -5px);
          }
          100% {
            opacity: 0;
            transform: translate(-10px, -10px);
          }
        }
      `}</style>
    </div>
  );
};
