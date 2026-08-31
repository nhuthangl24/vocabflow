import { createAdminClient } from "@/lib/supabase/admin";
import { PaymentsClient } from "./PaymentsClient";

export const revalidate = 0; // Disable cache for admin

export default async function AdminOrdersPage() {
  const supabase = createAdminClient();

  // Fetch all orders
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching orders:", error);
  }
  
  // Fetch users to map emails
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userMap = new Map(users.map(u => [u.id, u.email]));

  // Format orders for UI
  const formattedOrders = orders?.map(order => ({
    id: order.id,
    user_email: userMap.get(order.user_id) || 'Unknown',
    plan_id: order.plan_id,
    amount: order.amount,
    status: order.status,
    transfer_content: order.transfer_content,
    created_at: order.created_at,
    paid_at: order.paid_at
  })) || [];

  return (
    <div className="w-full animate-in fade-in duration-500">
      <PaymentsClient initialOrders={formattedOrders} />
    </div>
  );
}
