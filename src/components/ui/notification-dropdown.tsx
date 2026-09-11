"use client";

import { useState, useEffect, useRef } from "react";
import { getNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";
import { checkUserDebt } from "@/app/actions/dashboard";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cn } from "@/lib/utils";

type NotificationType = {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasDebt, setHasDebt] = useState(false);
  const [supabaseId, setSupabaseId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSupabaseId(session.user.id);
      const res = await getNotifications(session.user.id);
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount || 0);
      }
      
      const debtStatus = await checkUserDebt(session.user.id);
      setHasDebt(debtStatus);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    fetchData();
  };

  const handleMarkAllAsRead = async () => {
    if (!supabaseId) return;
    await markAllAsRead(supabaseId);
    fetchData();
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) fetchData(); // Refresh when opening
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={toggleDropdown}
        className={cn(
          "relative p-2 rounded-lg transition-colors duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary/20",
          hasDebt 
            ? "text-error hover:bg-error/10 animate-pulse" 
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
        )}
      >
        <span className="material-symbols-outlined text-[20px]">notifications</span>
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error animate-pulse shadow-sm shadow-error/30" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between bg-surface-container-low/30 rounded-t-xl">
            <h3 className="text-label-lg font-bold text-on-surface">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllAsRead}
                className="text-label-sm font-semibold text-primary hover:text-primary-container transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-[32px] text-outline opacity-50">notifications_paused</span>
                <p className="text-body-sm text-outline font-medium">No notifications yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-outline-variant/20">
                {notifications.map((notif) => (
                  <li 
                    key={notif._id} 
                    className={`p-4 transition-colors hover:bg-surface-container-lowest/80 cursor-pointer ${notif.isRead ? 'opacity-70 bg-transparent' : 'bg-primary-container/5'}`}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif._id);
                    }}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${notif.isRead ? 'bg-surface-variant text-outline' : 'bg-primary text-on-primary shadow-sm'}`}>
                         <span className="material-symbols-outlined text-[16px]">
                           {notif.type === 'expense_added' ? 'receipt_long' : notif.type === 'settlement' ? 'payments' : 'group'}
                         </span>
                      </div>
                      <div className="flex-1">
                        <h4 className={`text-label-md ${notif.isRead ? 'font-medium text-on-surface-variant' : 'font-bold text-on-surface'}`}>
                          {notif.title}
                        </h4>
                        <p className={`text-body-sm mt-0.5 line-clamp-2 ${notif.isRead ? 'text-outline' : 'text-on-surface-variant'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-outline">
                            {new Date(notif.createdAt).toLocaleDateString()}
                          </span>
                          {notif.link && (
                            <Link href={notif.link} onClick={() => setIsOpen(false)} className="text-label-sm font-semibold text-primary hover:underline flex items-center gap-1">
                              View <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                            </Link>
                          )}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <div className={cn("w-2 h-2 rounded-full shrink-0 self-center", hasDebt ? "bg-error animate-pulse shadow-sm shadow-error/30" : "bg-primary")} />
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
