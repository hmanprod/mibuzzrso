interface SocialButtonProps {
  icon: React.ReactNode;
  provider: string;
  onClick: () => void;
}

export default function SocialButton({ icon, provider, onClick }: SocialButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-12 h-12 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors"
      aria-label={`Continuer avec ${provider}`}
    >
      {icon}
    </button>
  );
}
