"use client";

import { useState } from "react";
import { approveOrderAction, rejectOrderAction } from "@/app/actions/payment";
import { Check, X, Loader2, Search, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function PaymentsClient({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const router = useRouter();

  const handleApprove = async (id: string, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setProcessingId(id);
    const res = await approveOrderAction(id);
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'approved' } : o));
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: 'approved' });
      toast.success("Order approved successfully");
      router.refresh();
    } else {
      toast.error("Error: " + res.error);
    }
    setProcessingId(null);
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    setProcessingId(rejectingId);
    const id = rejectingId;
    const reason = rejectReason;
    setRejectingId(null);
    setRejectReason("");

    const res = await rejectOrderAction(id, reason);
    if (res.success) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'rejected', admin_note: reason } : o));
      if (selectedOrder?.id === id) setSelectedOrder({ ...selectedOrder, status: 'rejected', admin_note: reason });
      toast.success("Order rejected");
      router.refresh();
    } else {
      toast.error("Error: " + res.error);
    }
    setProcessingId(null);
  };

  const filteredOrders = orders.filter(o => {
    const matchesFilter = filter === "all" || o.status === filter;
    const matchesSearch = search === "" || 
      o.transfer_content?.toLowerCase().includes(search.toLowerCase()) ||
      o.user_email?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-[#0a0a0a] border border-neutral-800 rounded-lg overflow-hidden">
      
      {/* Filters & Search */}
      <div className="p-4 border-b border-neutral-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-900/30">
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setFilter("all")} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === 'all' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>All</button>
          <button onClick={() => setFilter("pending")} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === 'pending' ? 'bg-blue-900/50 text-blue-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>Pending</button>
          <button onClick={() => setFilter("approved")} className={`px-4 py-1.5 text-sm rounded-md transition-colors ${filter === 'approved' ? 'bg-emerald-900/50 text-emerald-400' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}>Approved</button>
        </div>
        
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or email..." 
            className="w-full bg-neutral-950 border border-neutral-800 rounded-md py-1.5 pl-9 pr-3 text-sm text-neutral-300 focus:outline-none focus:border-neutral-600 transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs uppercase bg-neutral-900/50 text-neutral-500 border-b border-neutral-800">
            <tr>
              <th className="px-6 py-4 font-medium">Transfer Code</th>
              <th className="px-6 py-4 font-medium">User Email</th>
              <th className="px-6 py-4 font-medium">Plan & Amount</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 italic">No orders found.</td>
              </tr>
            ) : filteredOrders.map((order) => (
              <tr key={order.id} className="border-b border-neutral-800/50 hover:bg-neutral-900/20 transition-colors">
                
                {/* Code */}
                <td className="px-6 py-4">
                  <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs">
                    {order.transfer_content}
                  </span>
                </td>
                
                {/* Email */}
                <td className="px-6 py-4 text-neutral-300">
                  {order.user_email}
                </td>
                
                {/* Plan */}
                <td className="px-6 py-4">
                  <div className="font-medium text-white uppercase">{order.plan_id}</div>
                  <div className="text-xs">{Number(order.amount).toLocaleString('vi-VN')} VND</div>
                </td>
                
                {/* Status */}
                <td className="px-6 py-4">
                  {order.status === 'pending' && <span className="text-blue-400 bg-blue-400/10 px-2 py-1 rounded-full text-xs">Pending</span>}
                  {order.status === 'approved' && <span className="text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full text-xs">Approved</span>}
                  {order.status === 'cancelled' && <span className="text-neutral-400 bg-neutral-400/10 px-2 py-1 rounded-full text-xs">Cancelled</span>}
                  {order.status === 'rejected' && <span className="text-red-400 bg-red-400/10 px-2 py-1 rounded-full text-xs">Rejected</span>}
                  {order.status === 'refunded' && <span className="text-amber-400 bg-amber-400/10 px-2 py-1 rounded-full text-xs">Refunded</span>}
                </td>
                
                {/* Date */}
                <td className="px-6 py-4">
                  <div className="text-neutral-300">{new Date(order.created_at).toLocaleDateString('vi-VN')}</div>
                  <div className="text-xs text-neutral-500">{new Date(order.created_at).toLocaleTimeString('vi-VN')}</div>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="mr-2 text-xs text-neutral-400 hover:text-white"
                  >
                    View Details
                  </button>
                  {order.status === 'pending' && (
                    <div className="inline-flex justify-end gap-2 align-middle">
                      <button 
                        onClick={(e) => handleApprove(order.id, e)}
                        disabled={processingId === order.id}
                        className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded transition-colors disabled:opacity-50"
                        title="Approve & Upgrade User"
                      >
                        {processingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setRejectingId(order.id); }}
                        disabled={processingId === order.id}
                        className="p-1.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded transition-colors disabled:opacity-50"
                        title="Reject Order"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Slide-over Order Details Panel */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedOrder(null)}>
          <div className="w-full max-w-md bg-[#0a0a0a] border-l border-neutral-800 h-full flex flex-col animate-in slide-in-from-right duration-300" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-white">Order Details</h2>
                <p className="text-sm text-neutral-400 font-mono mt-1">{selectedOrder.id}</p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Order Info */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Transaction Info</h3>
                <div className="bg-neutral-900/50 rounded-lg p-4 space-y-3 text-sm border border-neutral-800/50">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Transfer Code</span>
                    <span className="font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-xs">{selectedOrder.transfer_content}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Amount</span>
                    <span className="font-semibold text-white">{Number(selectedOrder.amount).toLocaleString('vi-VN')} VND</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">User Email</span>
                    <span className="text-white">{selectedOrder.user_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Plan</span>
                    <span className="text-white uppercase">{selectedOrder.plan_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Created At</span>
                    <span className="text-white">{new Date(selectedOrder.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">Admin Notes</h3>
                {selectedOrder.admin_note ? (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-200">
                    {selectedOrder.admin_note}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-500 italic">No notes.</p>
                )}
              </div>

            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-neutral-800 bg-neutral-900/30">
              {selectedOrder.status === 'pending' && (
                <div className="flex gap-3">
                  <button onClick={() => handleApprove(selectedOrder.id)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-md font-medium transition-colors">
                    Approve Order
                  </button>
                  <button onClick={() => setRejectingId(selectedOrder.id)} className="flex-1 bg-neutral-800 hover:bg-red-900/50 hover:text-red-400 text-neutral-300 py-2 rounded-md font-medium transition-colors border border-neutral-700 hover:border-red-500/30">
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setRejectingId(null)}>
          <div className="bg-[#0a0a0a] border border-neutral-800 p-6 rounded-xl w-full max-w-sm animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-4 text-red-500">
              <AlertCircle className="w-5 h-5" />
              <h3 className="text-lg font-bold text-white">Reject Order</h3>
            </div>
            <p className="text-sm text-neutral-400 mb-4">Are you sure you want to reject this order? Please provide a reason below.</p>
            
            <textarea 
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="E.g., Invalid transfer code, wrong amount..."
              className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-red-500/50 min-h-[100px] mb-6"
            />
            
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectingId(null)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button 
                onClick={confirmReject}
                className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
