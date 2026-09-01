"use client";

import { useState } from "react";
import { Bell, Send, Trash2, Plus, Users, Target, Activity } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { createNotificationAction, deleteNotificationAction } from "./actions";

export default function NotificationsClient({ initialNotifications }: { initialNotifications: any[] }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("promotion");
  const [targetType, setTargetType] = useState("all");
  const [targetPlan, setTargetPlan] = useState("PRO");
  const [includeNewUsers, setIncludeNewUsers] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return toast.error("Vui lòng nhập tiêu đề và nội dung.");

    setIsSubmitting(true);
    let target_users: any = { type: targetType, include_new_users: includeNewUsers };
    if (targetType === "plan") target_users.plan_id = targetPlan.toLowerCase();

    const result = await createNotificationAction({
      title,
      message,
      type,
      target_users
    });

    if (result.success) {
      toast.success("Đã gửi thông báo thành công!");
      setIsModalOpen(false);
      router.refresh();
      // Optimistic update
      setNotifications([{
        id: Math.random().toString(),
        title,
        message,
        type,
        target_users,
        created_at: new Date().toISOString()
      }, ...notifications]);
      
      setTitle("");
      setMessage("");
    } else {
      toast.error(result.error || "Có lỗi xảy ra");
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa thông báo này?")) return;
    const result = await deleteNotificationAction(id);
    if (result.success) {
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success("Đã xóa thông báo");
    } else {
      toast.error(result.error || "Không thể xóa");
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-3rem)] md:h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      <div className="flex-none flex items-center justify-between gap-4 border-b border-neutral-800/60 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            Notification Center
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Gửi thông báo Push đến người dùng</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition"
        >
          <Send className="w-4 h-4" />
          Gửi thông báo mới
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-[#0a0a0a] rounded-xl border border-neutral-800/60 overflow-hidden shadow-xl shadow-black/40 flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="text-xs text-neutral-500 bg-neutral-900/40 uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-5 py-4 font-medium">Nội dung</th>
                <th className="px-5 py-4 font-medium">Đối tượng</th>
                <th className="px-5 py-4 font-medium">Loại</th>
                <th className="px-5 py-4 font-medium">Ngày gửi</th>
                <th className="px-5 py-4 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {notifications.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-neutral-500">Chưa có thông báo nào được gửi</td></tr>
              ) : notifications.map((noti) => (
                <tr key={noti.id} className="hover:bg-neutral-900/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-bold text-neutral-200">{noti.title}</div>
                    <div className="text-xs text-neutral-500 mt-1 line-clamp-1 max-w-sm">{noti.message}</div>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs border bg-neutral-800/50 text-neutral-300 border-neutral-700">
                      {noti.target_users?.type === 'all' ? <><Users className="w-3 h-3" /> Tất cả User</> :
                       noti.target_users?.type === 'plan' ? <><Target className="w-3 h-3" /> Gói {noti.target_users?.plan_id?.toUpperCase()}</> :
                       <><Target className="w-3 h-3" /> Tùy chỉnh</>}
                    </span>
                    {noti.target_users?.include_new_users === false && (
                      <span className="block mt-1 text-[10px] text-amber-500 font-medium">
                        * Chỉ user hiện tại
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs uppercase tracking-wider text-neutral-400">
                      {noti.type}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-xs">
                    {new Date(noti.created_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
                    <button onClick={() => handleDelete(noti.id)} className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0a0a0a] border border-neutral-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-neutral-800 flex justify-between items-center bg-neutral-900/40">
              <h3 className="font-bold text-white flex items-center gap-2"><Send className="w-5 h-5 text-indigo-400" /> Tạo thông báo mới</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Loại thông báo</label>
                <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white outline-none focus:border-indigo-500">
                  <option value="system">Hệ thống (System)</option>
                  <option value="promotion">Khuyến mãi (Promotion)</option>
                  <option value="feature">Tính năng mới (Feature)</option>
                  <option value="warning">Cảnh báo (Warning)</option>
                  <option value="maintenance">Bảo trì (Maintenance)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Đối tượng nhận</label>
                <select value={targetType} onChange={e => setTargetType(e.target.value)} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white outline-none focus:border-indigo-500">
                  <option value="all">Tất cả người dùng</option>
                  <option value="plan">Theo Gói (Plan)</option>
                </select>
              </div>

              {targetType === 'plan' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Chọn Gói</label>
                  <select value={targetPlan} onChange={e => setTargetPlan(e.target.value)} className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white outline-none focus:border-indigo-500">
                    <option value="FREE">Gói FREE</option>
                    <option value="BASIC">Gói BASIC</option>
                    <option value="PRO">Gói PRO</option>
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="includeNewUsers" 
                  checked={includeNewUsers} 
                  onChange={e => setIncludeNewUsers(e.target.checked)} 
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-900 text-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="includeNewUsers" className="text-sm font-medium text-neutral-300 select-none cursor-pointer">
                  Gửi thông báo này cho cả User tạo tài khoản sau ngày hôm nay
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Tiêu đề</label>
                <input 
                  type="text" required value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white outline-none focus:border-indigo-500 placeholder-neutral-600"
                  placeholder="Ví dụ: Tính năng Shadowing mới đã ra mắt!"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-400 mb-1">Nội dung</label>
                <textarea 
                  required value={message} onChange={e => setMessage(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-white outline-none focus:border-indigo-500 placeholder-neutral-600 resize-none"
                  placeholder="Nhập nội dung thông báo..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800/60">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-neutral-400 hover:text-white">
                  Hủy
                </button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 flex items-center gap-2">
                  {isSubmitting ? "Đang gửi..." : <><Send className="w-4 h-4"/> Bắn thông báo</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
