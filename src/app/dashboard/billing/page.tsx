import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Receipt, Clock, CheckCircle2, XCircle } from "lucide-react";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">Billing & Invoices</h1>
        <p className="text-neutral-400">View your payment history and active subscriptions.</p>
      </div>

      <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-neutral-800 bg-neutral-900/30">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500" /> Payment History
          </h2>
        </div>

        <div className="divide-y divide-neutral-800">
          {orders && orders.length > 0 ? (
            orders.map(order => (
              <div key={order.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-neutral-900/20 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-medium text-white uppercase text-lg">{order.plan_id} Plan</span>
                    {order.status === 'approved' && <span className="flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Approved</span>}
                    {order.status === 'pending' && <span className="flex items-center gap-1 text-xs text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending Review</span>}
                    {(order.status === 'rejected' || order.status === 'cancelled') && <span className="flex items-center gap-1 text-xs text-red-500 bg-red-500/10 px-2 py-1 rounded-full"><XCircle className="w-3 h-3" /> {order.status}</span>}
                  </div>
                  <div className="text-sm text-neutral-400 flex items-center gap-2">
                    <span>{new Date(order.created_at).toLocaleDateString('vi-VN')}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-400">Ref: {order.transfer_content}</span>
                  </div>
                  {order.admin_note && (
                    <div className="mt-2 text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded">
                      Note from support: {order.admin_note}
                    </div>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{Number(order.amount).toLocaleString('vi-VN')} VND</div>
                  <div className="text-xs text-neutral-500 uppercase">{order.bank_code}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <Receipt className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No payments yet</h3>
              <p className="text-neutral-500 text-sm">When you upgrade your account, your invoices will appear here.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
