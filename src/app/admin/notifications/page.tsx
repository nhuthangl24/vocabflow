import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import NotificationsClient from "./NotificationsClient";

export const dynamic = 'force-dynamic';

export default async function AdminNotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  if (!user.email || !adminEmails.includes(user.email)) redirect('/dashboard');

  // Fetch recent notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return <NotificationsClient initialNotifications={notifications || []} />;
}
