import { useEffect, useState } from "react";
import { FaBell, FaSearch, FaTags, FaCheckCircle, FaTimes } from "react-icons/fa";
import { supabase } from "../services/supabase";

export default function Navbar({ title = "Dashboard", subtitle = "Selamat datang kembali" }) {
  const [email, setEmail] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user?.email || "Admin");
    });

    fetchNotifications();

    // Subscribe Realtime — dengarkan INSERT baru di tabel notifications
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
          setUnread((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function fetchNotifications() {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications(data || []);
    setUnread((data || []).filter((n) => !n.is_read).length);
  }

  async function markAllRead() {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnread(0);
  }

  async function markRead(id) {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnread((prev) => Math.max(0, prev - 1));
  }

  const initial = email.charAt(0).toUpperCase();

  const typeIcon = {
    promo: <FaTags className="text-amber-400 text-xs" />,
    default: <FaBell className="text-blue-400 text-xs" />,
  };

  return (
    <div className="flex items-center justify-between mb-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
          <FaSearch className="text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Cari..."
            className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-40"
          />
        </div>

        {/* Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-amber-500 hover:border-amber-400 transition-all shadow-sm"
          >
            <FaBell className="text-sm" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-gray-900 text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {/* Dropdown Notifikasi */}
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <h3 className="text-gray-900 font-semibold text-sm">Notifikasi</h3>
                  {unread > 0 && (
                    <span className="bg-amber-500 text-gray-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unread}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-amber-500 hover:text-amber-600 transition-colors"
                    >
                      Tandai semua
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotif(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <FaBell className="text-gray-300 text-2xl mb-2" />
                    <p className="text-gray-400 text-sm">Belum ada notifikasi</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => !notif.is_read && markRead(notif.id)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                        !notif.is_read ? "bg-amber-50" : ""
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.type === "promo"
                          ? "bg-amber-100 border border-amber-200"
                          : "bg-blue-100 border border-blue-200"
                      }`}>
                        {typeIcon[notif.type] || typeIcon.default}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-tight ${notif.is_read ? "text-gray-400" : "text-gray-900 font-medium"}`}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(notif.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-sm">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-gray-900 font-bold text-sm">
            {initial}
          </div>
          <span className="text-sm text-gray-700 max-w-[120px] truncate">{email}</span>
        </div>
      </div>
    </div>
  );
}

