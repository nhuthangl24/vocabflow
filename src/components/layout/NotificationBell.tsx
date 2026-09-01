"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Check, CircleAlert, Crown, Zap, Info, CreditCard } from "lucide-react";
import { getNotificationsAction, markNotificationAsReadAction } from "@/app/actions/notifications";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

interface NotificationBellProps {
  placement?: 'top' | 'bottom';
}

export default function NotificationBell({ placement = 'bottom' }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Setup polling every 1 minute
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const res = await getNotificationsAction(15);
    if (res.success) {
      setNotifications(res.data || []);
      setUnreadCount(res.unreadCount || 0);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const res = await markNotificationAsReadAction(id);
    if (res.success) {
      if (id === 'all') {
        setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      } else {
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'billing': return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'alert': return <CircleAlert className="w-4 h-4 text-rose-500" />;
      case 'marketing': return <Zap className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-sm dark:bg-[#0a0a0a] dark:border-neutral-700 dark:hover:bg-neutral-800 dark:text-neutral-400 dark:hover:text-white"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center border-2 border-white dark:border-[#0a0a0a]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border border-slate-200 animate-in fade-in ${placement === 'top' ? 'slide-in-from-bottom-2' : 'slide-in-from-top-2'} duration-200 z-[100] dark:bg-[#0a0a0a] dark:border-neutral-700 overflow-hidden flex flex-col max-h-[85vh]`}>
          <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-neutral-900/20">
            <h3 className="font-bold text-slate-900 dark:text-white text-[15px]">Thông báo</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => handleMarkAsRead('all')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                Đánh dấu đã đọc
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto min-h-[300px]">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500 dark:text-neutral-500">
                <Bell className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">Bạn chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-neutral-800/50">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-neutral-900/50 cursor-pointer flex gap-3 ${!notification.is_read ? 'bg-indigo-50/30 dark:bg-indigo-500/5' : ''}`}
                    onClick={() => {
                      if (!notification.is_read) handleMarkAsRead(notification.id);
                    }}
                  >
                    <div className="shrink-0 mt-0.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${!notification.is_read ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'bg-slate-100 dark:bg-neutral-800'}`}>
                        {getIconForType(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className={`text-sm font-semibold truncate ${!notification.is_read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-neutral-300'}`}>
                          {notification.title}
                        </h4>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1.5 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                        )}
                      </div>
                      {notification.content && (
                        <p className={`text-xs line-clamp-2 leading-relaxed ${!notification.is_read ? 'text-slate-600 dark:text-neutral-400' : 'text-slate-500 dark:text-neutral-500'}`}>
                          {notification.content}
                        </p>
                      )}
                      <p className="text-[10px] font-medium text-slate-400 dark:text-neutral-500 mt-2 flex items-center gap-1">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: vi })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
