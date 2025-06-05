import { Avatar } from "@/components/ui/Avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ParticipateSectionProps {
  challenge: {
    status: 'active' | 'completed';
  };
  profile: {
    pseudo_url?: string | null;
    avatar_url?: string | null;
    stage_name?: string | null;
    email?: string | null;
  } | null;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function ParticipateSection({
  profile,
  setIsModalOpen,
}: ParticipateSectionProps) {
  return (
    <div className="bg-white rounded-[18px] p-4 space-y-4 mb-4">
      <div className="flex items-center gap-3">
        <Link href={`/profile/${profile?.pseudo_url || ""}`}>
          <Avatar
            src={profile?.avatar_url || null}
            stageName={profile?.stage_name || profile?.email?.[0]}
            size={40}
            className="rounded-full"
          />
        </Link>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 h-12 px-4 rounded-[18px] bg-gray-50 hover:bg-gray-100 text-left text-gray-500 transition-colors"
        >
          Je veux participer au challenge
        </Button>
      </div>
    </div>
  );
}
