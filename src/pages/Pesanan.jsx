import { useEffect, useState } from "react";
import {
  FaClipboardList, FaCheckCircle, FaMotorcycle,
  FaSearch, FaSync, FaTrash, FaEye, FaTimes,
  FaMapMarkerAlt, FaPhone, FaUser, FaBox,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

const statusConfig = {
  Selesai: {
    badge: "bg-green-500/10 text-green-400 border-green-500/20",
    dot: "bg-green-400",
  },
  "Sedang Diantar": {
    badge: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    dot: "bg-blue-400",
  },
};

const defaultStatus = {
  badge: "bg-gray-100 text-gray-500 border-gray-300",
  dot: "bg-zinc-500",
};

export default function Pesanan() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("Semua");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => { fetchOrders(); }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`*, order_items(quantity, product_name, price)`)
      .order("created_at", { ascending: false });
    setOrders(data || []);
    setLoading(false);
  }

  async function openDetail(order) {
    setDetailLoading(true);
    setSelectedOrder(order);

    const { data } = await supabase
      .from("orders")
      .select(`
        *,
        order_items(id, product_name, quantity, price, is_free),
        user_addresses(recipient_name, phone, phone_number, full_address, label)
      `)
      .eq("id", order.id)
      .single();

    let orderData = data || order;

    if (!orderData.user_addresses && orderData.user_id) {
      const { data: addr } = await supabase
        .from("user_addresses")
        .select("recipient_name, phone, phone_number, full_address, label")
        .eq("user_id", orderData.user_id)
        .eq("is_default", true)
        .maybeSingle();
      if (addr) orderData = { ...orderData, user_addresses: addr };
    }

    setSelectedOrder(orderData);
    setDetailLoading(false);
  }

  async function refresh() {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }

  async function updateStatus(id, status) {
    await supabase.from("orders").update({ status }).eq("id", id);

    const { data: order } = await supabase
      .from("orders").select("user_id, id").eq("id", id).single();

    if (order?.user_id) {
      const now = new Date();
      const timeDisplay = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      const notifMap = {
        "Sedang Diantar": {
          title: "🛵 Pesanan Sedang Diantar",
          message: `Pesanan #${id} kamu sedang dalam perjalanan. Harap siapkan diri untuk menerima pesanan!`,
          icon_name: "delivery_dining",
        },
        Selesai: {
          title: "✅ Pesanan Selesai",
          message: `Pesanan #${id} telah berhasil diterima. Terima kasih sudah memesan!`,
          icon_name: "star",
        },
      };
      const notif = notifMap[status];
      if (notif) {
        await supabase.from("notifications").insert([{
          user_id: order.user_id,
          title: notif.title,
          message: notif.message,
          type: "order",
          icon_name: notif.icon_name,
          group_day: "Hari Ini",
          time_display: timeDisplay,
          is_read: false,
        }]);
      }
    }

    // Update di modal juga kalau sedang terbuka
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({ ...prev, status }));
    }
    fetchOrders();
  }

  async function deleteOrder(id) {
    if (!confirm(`Hapus pesanan #${id}?`)) return;
    await supabase.from("orders").delete().eq("id", id);
    if (selectedOrder?.id === id) setSelectedOrder(null);
    fetchOrders();
  }

  async function deleteAllOrders() {
    if (!confirm("Hapus SEMUA pesanan? Tindakan ini tidak bisa dibatalkan!")) return;
    setDeletingAll(true);
    await supabase.from("orders").delete().neq("id", 0);
    setDeletingAll(false);
    setSelectedOrder(null);
    fetchOrders();
  }

  const filtered = orders
    .filter((o) => filter === "Semua" || o.status === filter)
    .filter((o) => search === "" || String(o.id).includes(search));

  const counts = {
    Semua: orders.length,
    "Sedang Diantar": orders.filter((o) => o.status === "Sedang Diantar").length,
    Selesai: orders.filter((o) => o.status === "Selesai").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status === "Selesai")
    .reduce((sum, o) => sum + (o.total_price || 0), 0);

  function getProductSummary(order) {
    const items = order.order_items || [];
    if (!items.length) return "—";
    return items.map((i) => `${i.product_name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ");
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Pesanan" subtitle="Kelola dan update status pesanan" />

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Pesanan", value: orders.length, color: "amber", icon: FaClipboardList },
            { label: "Sedang Diantar", value: counts["Sedang Diantar"], color: "blue", icon: FaMotorcycle },
            { label: "Revenue Selesai", value: `Rp ${totalRevenue.toLocaleString("id-ID")}`, color: "green", icon: FaCheckCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
              <div className={`w-12 h-12 bg-${color}-500/10 border border-${color}-500/20 rounded-xl flex items-center justify-center`}>
                <Icon className={`text-${color}-400 text-xl`} />
              </div>
              <div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</p>
                <p className="text-gray-900 text-2xl font-bold mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              {["Semua", "Sedang Diantar", "Selesai"].map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filter === s ? "bg-amber-500 text-black" : "bg-gray-100 border border-gray-300 text-gray-500 hover:text-gray-900"
                  }`}>
                  {s}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    filter === s ? "bg-black/20 text-black" : "bg-gray-200 text-gray-700"
                  }`}>{counts[s] ?? orders.length}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-xl px-3 py-2">
                <FaSearch className="text-gray-400 text-xs" />
                <input type="text" placeholder="Cari Order ID..." value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm text-gray-900 placeholder-zinc-600 outline-none w-32" />
              </div>

              {orders.length > 0 && (
                <button onClick={deleteAllOrders} disabled={deletingAll}
                  className="flex items-center gap-2 text-xs bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl transition-all font-medium">
                  {deletingAll
                    ? <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin" />
                    : <FaTrash className="text-[10px]" />}
                  Hapus Semua
                </button>
              )}

              <button onClick={refresh}
                className="w-9 h-9 bg-gray-100 border border-gray-300 rounded-xl flex items-center justify-center text-gray-500 hover:text-amber-400 hover:border-amber-500/40 transition-all">
                <FaSync className={`text-xs ${refreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FaClipboardList className="text-gray-400 text-xl" />
              </div>
              <p className="text-gray-500 font-medium">Tidak ada pesanan</p>
              <p className="text-gray-400 text-sm mt-1">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {["Order ID", "Produk", "Status", "Total", "Tanggal", "Aksi"].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((item) => {
                  const cfg = statusConfig[item.status] || defaultStatus;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono font-semibold text-gray-700">#{item.id}</span>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-sm text-gray-700 truncate" title={getProductSummary(item)}>
                          {getProductSummary(item)}
                        </p>
                        {(item.order_items?.length || 0) > 1 && (
                          <p className="text-xs text-gray-400 mt-0.5">{item.order_items.length} item</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {item.status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">
                          Rp {item.total_price?.toLocaleString("id-ID") ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-400">
                          {item.created_at
                            ? new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })
                            : "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Detail */}
                          <button onClick={() => openDetail(item)}
                            className="flex items-center gap-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg transition-all">
                            <FaEye className="text-xs" /> Detail
                          </button>
                          {/* Kirim */}
                          <button onClick={() => updateStatus(item.id, "Sedang Diantar")}
                            disabled={item.status === "Sedang Diantar"}
                            className="flex items-center gap-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg transition-all">
                            <FaMotorcycle className="text-xs" /> Kirim
                          </button>
                          {/* Selesai */}
                          <button onClick={() => updateStatus(item.id, "Selesai")}
                            disabled={item.status === "Selesai"}
                            className="flex items-center gap-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-green-500/20 text-green-400 px-3 py-1.5 rounded-lg transition-all">
                            <FaCheckCircle className="text-xs" /> Selesai
                          </button>
                          {/* Hapus */}
                          <button onClick={() => deleteOrder(item.id)}
                            className="w-7 h-7 bg-gray-100 hover:bg-red-500/10 border border-gray-300 hover:border-red-500/20 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-400 transition-all">
                            <FaTrash className="text-[10px]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {!loading && filtered.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200">
              <p className="text-gray-400 text-xs">
                Menampilkan <span className="text-gray-500 font-medium">{filtered.length}</span> dari{" "}
                <span className="text-gray-500 font-medium">{orders.length}</span> pesanan
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Detail Pesanan ── */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-gray-900 font-semibold">Detail Pesanan</h3>
                <p className="text-gray-400 text-xs mt-0.5 font-mono">#{selectedOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const cfg = statusConfig[selectedOrder.status] || defaultStatus;
                  return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${cfg.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                      {selectedOrder.status || "—"}
                    </span>
                  );
                })()}
                <button onClick={() => setSelectedOrder(null)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all">
                  <FaTimes className="text-xs" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto flex-1 p-6 flex flex-col gap-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Info Pemesan */}
                  <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Info Pemesan</p>

                    {/* Nama penerima */}
                    {(selectedOrder.user_addresses?.recipient_name || selectedOrder.recipient_name) && (
                      <div className="flex items-center gap-3">
                        <FaUser className="text-gray-400 text-sm flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Nama Penerima</p>
                          <p className="text-sm text-gray-700 font-medium">
                            {selectedOrder.user_addresses?.recipient_name || selectedOrder.recipient_name}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Nomor HP */}
                    {(selectedOrder.user_addresses?.phone_number || selectedOrder.user_addresses?.phone || selectedOrder.phone) && (
                      <div className="flex items-center gap-3">
                        <FaPhone className="text-gray-400 text-sm flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-400">Nomor HP</p>
                          <p className="text-sm text-gray-700">
                            {selectedOrder.user_addresses?.phone_number || selectedOrder.user_addresses?.phone || selectedOrder.phone}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Alamat */}
                    {(selectedOrder.user_addresses?.full_address || selectedOrder.address) && (
                      <div className="flex items-start gap-3">
                        <FaMapMarkerAlt className="text-gray-400 text-sm flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Alamat Pengiriman</p>
                          <p className="text-sm text-gray-700 leading-relaxed">
                            {selectedOrder.user_addresses?.full_address || selectedOrder.address}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Catatan */}
                    {(selectedOrder.order_note || selectedOrder.order_notes) && (
                      <div className="flex items-start gap-3">
                        <FaClipboardList className="text-gray-400 text-sm flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-400">Catatan</p>
                          <p className="text-sm text-gray-700">
                            {selectedOrder.order_note || selectedOrder.order_notes}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Promo */}
                    {selectedOrder.promo_code && (
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm flex-shrink-0">🎟</span>
                        <div>
                          <p className="text-xs text-gray-400">Promo Dipakai</p>
                          <p className="text-sm text-green-400 font-semibold">{selectedOrder.promo_code}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daftar Produk */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <FaBox className="text-gray-400 text-sm" />
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Item Pesanan</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(selectedOrder.order_items || []).length === 0 ? (
                        <p className="text-gray-400 text-sm px-1">Tidak ada item</p>
                      ) : (
                        selectedOrder.order_items.map((item, i) => (
                          <div key={item.id || i} className={`flex items-center justify-between rounded-xl px-4 py-3 ${
                            item.is_free
                              ? "bg-green-500/10 border border-green-500/20"
                              : "bg-gray-100"
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                                item.is_free
                                  ? "bg-green-500/20 border border-green-500/30"
                                  : "bg-amber-500/10 border border-amber-500/20"
                              }`}>
                                <span className={`text-xs font-bold ${item.is_free ? "text-green-400" : "text-amber-400"}`}>
                                  {item.quantity}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-700 font-medium">{item.product_name}</p>
                                {item.is_free && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full mt-0.5">
                                    🎁 GRATIS
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {item.is_free ? (
                                <div>
                                  <p className="text-xs text-gray-400 line-through">
                                    Rp {((item.price || 0) * (item.quantity || 1)).toLocaleString("id-ID")}
                                  </p>
                                  <p className="text-sm text-green-400 font-semibold">Rp 0</p>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Rp {((item.price || 0) * (item.quantity || 1)).toLocaleString("id-ID")}
                                </p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Ringkasan Harga */}
                  <div className="bg-gray-100 rounded-xl p-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ringkasan</p>
                    {selectedOrder.subtotal != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Subtotal</span>
                        <span className="text-gray-700">Rp {selectedOrder.subtotal.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {selectedOrder.shipping_fee != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Ongkos Kirim</span>
                        <span className="text-gray-700">Rp {selectedOrder.shipping_fee.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {selectedOrder.service_fee != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Biaya Layanan</span>
                        <span className="text-gray-700">Rp {selectedOrder.service_fee.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">Diskon {selectedOrder.promo_code ? `(${selectedOrder.promo_code})` : ""}</span>
                        <span className="text-green-400">- Rp {selectedOrder.discount_amount.toLocaleString("id-ID")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold pt-2 border-t border-gray-300 mt-1">
                      <span className="text-gray-900">Total</span>
                      <span className="text-amber-400">Rp {selectedOrder.total_price?.toLocaleString("id-ID") ?? "—"}</span>
                    </div>
                  </div>

                  {/* Tanggal */}
                  <p className="text-xs text-gray-400 text-center">
                    Dipesan pada {selectedOrder.created_at
                      ? new Date(selectedOrder.created_at).toLocaleString("id-ID", {
                          day: "numeric", month: "long", year: "numeric",
                          hour: "2-digit", minute: "2-digit",
                        })
                      : "—"}
                  </p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => updateStatus(selectedOrder.id, "Sedang Diantar")}
                disabled={selectedOrder.status === "Sedang Diantar"}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-blue-500/20 text-blue-400 py-2.5 rounded-xl transition-all font-medium">
                <FaMotorcycle /> Kirim
              </button>
              <button
                onClick={() => updateStatus(selectedOrder.id, "Selesai")}
                disabled={selectedOrder.status === "Selesai"}
                className="flex-1 flex items-center justify-center gap-2 text-sm bg-green-500/10 hover:bg-green-500/20 disabled:opacity-30 disabled:cursor-not-allowed border border-green-500/20 text-green-400 py-2.5 rounded-xl transition-all font-medium">
                <FaCheckCircle /> Selesai
              </button>
              <button
                onClick={() => deleteOrder(selectedOrder.id)}
                className="w-11 h-11 bg-gray-100 hover:bg-red-500/10 border border-gray-300 hover:border-red-500/20 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 transition-all">
                <FaTrash className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

