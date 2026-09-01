import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { createClient } from "@/lib/supabase/server";
import PresenceProvider from "@/components/providers/PresenceProvider";
import { getUserPlanFeatures } from "@/lib/plans";
import NotificationBell from "@/components/layout/NotificationBell";
import DevToolsDetector from "@/components/DevToolsDetector";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const planFeatures = await getUserPlanFeatures(user);

  return (
    <div className="flex h-screen bg-grid-paper font-sans overflow-hidden">
      {user && user.email && <PresenceProvider userId={user.id} email={user.email} />}
      {user && <DevToolsDetector />}
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen relative min-w-0">
        <MobileHeader user={user} planFeatures={planFeatures} />
        
        {/* Desktop Notification Bell */}
        {user && (
          <div className="hidden md:block absolute top-6 right-8 z-50">
            <NotificationBell placement="bottom" />
          </div>
        )}

        <main className="flex-1 overflow-y-auto scrollbar-hide relative z-0">
          {children}
        </main>
      </div>
    </div>
  );
}
