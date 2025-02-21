import Image from "next/image";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Feed from "@/components/Feed";
import RightSidebar from "@/components/RightSidebar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex justify-between gap-6 px-6 pt-[70px]">
        {/* Sidebar gauche: 15-18% (220-250px) */}
        <Sidebar className="w-[250px] fixed left-6 top-[70px] bottom-0" />
        
        {/* Feed central: 45-50% (650-720px) */}
        <main className="ml-[274px] max-w-[720px] w-full">
          <Feed />
        </main>
        
        {/* Sidebar droite: 20-25% (280-350px) */}
        <RightSidebar className="w-[400px] fixed right-6 top-[47px] bottom-0" />
      </div>
    </div>
  );
}
