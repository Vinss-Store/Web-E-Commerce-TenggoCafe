import { useEffect, useState } from "react";
import {
  FaTags, FaTrash, FaPlus, FaTimes, FaMotorcycle,
  FaGift, FaPercent, FaToggleOn, FaToggleOff, FaEdit,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

const PROMO_TYPES = [
  { value: "discount", label: "Potongan Harga", icon: FaPercent, color: "amber" },
  { value: "free_shipping", label: "Gratis Ongkir", icon: FaMotorcycle, color: "blue" },
  { value: "free_product", label: "Gratis Produk", icon: FaGift, color: "green" },
];

const TYPE_BADGE = {
  discount: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  free_shipping: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  free_product: "bg-green-500/10 text-green-400 border-green-500/20",
};

const TYPE_LABEL = {
  discount: "Potongan Harga",
  free_shipping: "Gratis Ongkir",
  free_product: "Gratis Produk",
};

const COLOR_PRESETS = [
  "#f59e0b", "#ef4444", "#3b82f6", "#10b981",
  "#8b5cf6", "#ec4899", "#f97316", "#06b6d4",
];

export default function Promo() {
  const [promos, setPromos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editPromo, setEditPromo] = useState(null);

  // Form state
  const [promoType, setPromoType] = useState("discount");
  const [discountType, setDiscountType] = useState("percent");
  const [selectedColor, setSelectedColor] = useState("#f59e0b");

  useEffect(() => {
    fetchPromos();
    fetchProducts();
  }, []);

  async function fetchPromos() {
    const { data } = await supabase
      .from("promos")
      .select("*, products(name)")
      .order("created_at", { ascending: false });
    setPromos(data || []);
  }

  async function fetchProducts() {
    const { data } = await supabase.from("products").select("id, name");
    setProducts(data || []);
  }

  function openForm(promo = null) {
    setEditPromo(promo);
    if (promo) {
      setPromoType(promo.type || "discount");
      setDiscountType(promo.discount_type || "percent");
      setSelectedColor(promo.color_hex || "#f59e0b");
    } else {
      setPromoType("discount");
      setDiscountType("percent");
      setSelectedColor("#f59e0b");
    }
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditPromo(null);
  }

  async function savePromo(e) {
    e.preventDefault();
    setLoading(true);

    const title = e.target.title.value.trim();
    const tag = e.target.tag.value.trim().toUpperCase();
    const description = e.target.description.value.trim();
    const min_order = parseInt(e.target.min_order.value) || 0;
    const expired_at = e.target.expired_at.value || null;

    let promoData = {
      title, tag, description, color_hex: selectedColor,
      type: promoType, min_order,
      expired_at: expired_at ? new Date(expired_at).toISOString() : null,
      is_active: true,
    };

    if (promoType === "discount") {
      promoData.discount_type = discountType;
      promoData.discount_value = parseFloat(e.target.discount_value.value) || 0;
      promoData.max_discount = discountType === "percent"
        ? parseInt(e.target.max_discount?.value) || 0
        : 0;
    } else if (promoType === "free_product") {
      promoData.free_product_id = parseInt(e.target.free_product_id.value) || null;
    }

    let promoError;
    if (editPromo) {
      const { error } = await supabase.from("promos").update(promoData).eq("id", editPromo.id);
      promoError = error;
    } else {
      const { error } = await supabase.from("promos").insert([promoData]);
      promoError = error;
    }

    if (promoError) {
      alert("Gagal menyimpan promo: " + promoError.message);
      setLoading(false);
      return;
    }

    // Kirim notifikasi ke semua user (hanya saat tambah baru)
    if (!editPromo) {
      const { data: users } = await supabase
        .from("orders").select("user_id").not("user_id", "is", null);

      if (users && users.length > 0) {
        const now = new Date();
        const timeDisplay = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const uniqueUserIds = [...new Set(users.map((u) => u.user_id))];

        const typeDesc = {
          discount: discountType === "percent"
            ? `Diskon ${e.target.discount_value?.value || 0}% untuk pembelianmu!`
            : `Potongan Rp ${parseInt(e.target.discount_value?.value || 0).toLocaleString("id-ID")}!`,
          free_shipping: "Nikmati gratis ongkir untuk pesananmu!",
          free_product: "Dapatkan produk gratis dengan pembelian minimum!",
        };

        const notifRows = uniqueUserIds.map((uid) => ({
          user_id: uid,
          title: `🎉 Promo Baru: ${title}`,
          message: description || typeDesc[promoType],
          type: "promo",
          icon_name: "local_offer",
          group_day: "Hari Ini",
          time_display: timeDisplay,
          is_read: false,
        }));
        await supabase.from("notifications").insert(notifRows);
      }
    }

    setLoading(false);
    closeForm();
    fetchPromos();
  }

  async function toggleActive(id, current) {
    await supabase.from("promos").update({ is_active: !current }).eq("id", id);
    fetchPromos();
  }

  async function deletePromo(id) {
    if (!confirm("Hapus promo ini?")) return;
    await supabase.from("promos").delete().eq("id", id);
    fetchPromos();
  }

  function formatDiscount(promo) {
    if (promo.type === "free_shipping") return "Gratis Ongkir";
    if (promo.type === "free_product") return `Gratis: ${promo.products?.name || "—"}`;
    if (promo.discount_type === "percent") return `${promo.discount_value}%`;
    return `Rp ${Number(promo.discount_value).toLocaleString("id-ID")}`;
  }

  function isExpired(promo) {
    if (!promo.expired_at) return false;
    return new Date(promo.expired_at) < new Date();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Promo" subtitle="Kelola promo dan penawaran spesial" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <FaTags className="text-amber-400" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">
                {promos.filter((p) => p.is_active && !isExpired(p)).length} Promo Aktif
              </p>
              <p className="text-gray-400 text-xs">{promos.length} total promo</p>
            </div>
          </div>
          <button onClick={() => openForm()}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20">
            <FaPlus className="text-xs" /> Tambah Promo
          </button>
        </div>

        {/* Promo Cards */}
        {promos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center mb-5">
              <FaTags className="text-gray-400 text-3xl" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Belum ada promo</p>
            <p className="text-gray-400 text-sm mt-1">Tambahkan promo pertama untuk menarik pelanggan</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {promos.map((item) => {
              const expired = isExpired(item);
              return (
                <div key={item.id}
                  style={{ background: `linear-gradient(135deg, ${item.color_hex || "#f59e0b"}, ${item.color_hex || "#f59e0b"}bb)` }}
                  className={`p-6 rounded-2xl relative group shadow-xl overflow-hidden transition-all ${
                    (!item.is_active || expired) ? "opacity-50 grayscale" : ""
                  }`}>
                  {/* Decorative */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-black/10" />

                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
                    <button onClick={() => openForm(item)}
                      className="w-7 h-7 bg-black/20 hover:bg-black/50 rounded-lg flex items-center justify-center">
                      <FaEdit className="text-gray-900 text-[10px]" />
                    </button>
                    <button onClick={() => toggleActive(item.id, item.is_active)}
                      className="w-7 h-7 bg-black/20 hover:bg-black/50 rounded-lg flex items-center justify-center">
                      {item.is_active
                        ? <FaToggleOn className="text-gray-900 text-xs" />
                        : <FaToggleOff className="text-gray-900 text-xs" />}
                    </button>
                    <button onClick={() => deletePromo(item.id)}
                      className="w-7 h-7 bg-black/20 hover:bg-red-500/60 rounded-lg flex items-center justify-center">
                      <FaTrash className="text-gray-900 text-[10px]" />
                    </button>
                  </div>

                  <div className="relative z-10">
                    {/* Type badge */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block bg-black/20 text-gray-900 text-xs font-bold px-3 py-1 rounded-full tracking-wider uppercase">
                        {item.tag}
                      </span>
                      <span className="inline-block bg-black/20 text-gray-900/80 text-[10px] px-2 py-1 rounded-full">
                        {TYPE_LABEL[item.type] || "Diskon"}
                      </span>
                    </div>

                    <h3 className="text-gray-900 text-lg font-bold leading-tight">{item.title}</h3>
                    <p className="text-gray-900/70 text-sm mt-1 leading-relaxed">{item.description}</p>

                    {/* Value */}
                    <div className="mt-4 bg-black/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
                      <span className="text-gray-900/60 text-xs">Nilai Promo</span>
                      <span className="text-gray-900 font-bold text-sm">{formatDiscount(item)}</span>
                    </div>

                    {/* Min order */}
                    {item.min_order > 0 && (
                      <p className="text-gray-900/50 text-xs mt-2">
                        Min. belanja Rp {item.min_order.toLocaleString("id-ID")}
                      </p>
                    )}

                    {/* Expired */}
                    {item.expired_at && (
                      <p className={`text-xs mt-1 ${expired ? "text-red-300" : "text-gray-900/50"}`}>
                        {expired ? "⚠️ Kedaluwarsa" : `Berlaku hingga ${new Date(item.expired_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal Form Promo ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 flex-shrink-0">
              <div>
                <h3 className="text-gray-900 font-semibold">{editPromo ? "Edit Promo" : "Tambah Promo"}</h3>
                <p className="text-gray-400 text-xs mt-0.5">Isi detail promo dengan lengkap</p>
              </div>
              <button onClick={closeForm}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all">
                <FaTimes className="text-xs" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              <form id="promo-form" onSubmit={savePromo} className="p-6 flex flex-col gap-5">

                {/* Tipe Promo */}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-3 block">Tipe Promo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROMO_TYPES.map((t) => {
                      const Icon = t.icon;
                      const active = promoType === t.value;
                      return (
                        <button key={t.value} type="button" onClick={() => setPromoType(t.value)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-xs font-medium ${
                            active
                              ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                              : "bg-gray-100 border-gray-300 text-gray-500 hover:text-gray-900 hover:border-zinc-600"
                          }`}>
                          <Icon className={`text-lg ${active ? "text-amber-400" : ""}`} />
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Judul & Kode */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Judul Promo</label>
                    <input type="text" name="title" required
                      defaultValue={editPromo?.title || ""}
                      placeholder="Diskon Akhir Pekan"
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Kode Promo</label>
                    <input type="text" name="tag" required
                      defaultValue={editPromo?.tag || ""}
                      placeholder="WEEKEND50"
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all uppercase" />
                  </div>
                </div>

                {/* Nilai Promo — kondisional */}
                {promoType === "discount" && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Jenis Potongan</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "percent", label: "Persentase (%)" },
                          { value: "fixed", label: "Nominal (Rp)" },
                        ].map((d) => (
                          <button key={d.value} type="button" onClick={() => setDiscountType(d.value)}
                            className={`py-2.5 rounded-xl border text-xs font-medium transition-all ${
                              discountType === d.value
                                ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                                : "bg-gray-100 border-gray-300 text-gray-500 hover:text-gray-900"
                            }`}>
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 mb-2 block">
                          {discountType === "percent" ? "Besar Diskon (%)" : "Nominal Potongan (Rp)"}
                        </label>
                        <input type="number" name="discount_value" required min="0"
                          defaultValue={editPromo?.discount_value || ""}
                          placeholder={discountType === "percent" ? "20" : "10000"}
                          className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                      </div>
                      {discountType === "percent" && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 mb-2 block">Maks. Potongan (Rp)</label>
                          <input type="number" name="max_discount" min="0"
                            defaultValue={editPromo?.max_discount || ""}
                            placeholder="50000"
                            className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {promoType === "free_product" && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Produk Gratis</label>
                    <select name="free_product_id" required
                      defaultValue={editPromo?.free_product_id || ""}
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all">
                      <option value="">Pilih produk</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {promoType === "free_shipping" && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <p className="text-blue-400 text-sm font-medium">🛵 Gratis Ongkir</p>
                    <p className="text-blue-400/70 text-xs mt-1">Ongkos kirim akan digratiskan saat user memakai kode ini</p>
                  </div>
                )}

                {/* Min Order & Expired */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Min. Belanja (Rp)</label>
                    <input type="number" name="min_order" min="0"
                      defaultValue={editPromo?.min_order || 0}
                      placeholder="0"
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Berlaku Hingga</label>
                    <input type="datetime-local" name="expired_at"
                      defaultValue={editPromo?.expired_at ? new Date(editPromo.expired_at).toISOString().slice(0, 16) : ""}
                      className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Deskripsi</label>
                  <textarea name="description" rows={2}
                    defaultValue={editPromo?.description || ""}
                    placeholder="Deskripsi singkat promo..."
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all resize-none" />
                </div>

                {/* Warna */}
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Warna Kartu</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((c) => (
                      <button key={c} type="button" onClick={() => setSelectedColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-lg transition-all ${
                          selectedColor === c ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110" : "opacity-70 hover:opacity-100"
                        }`} />
                    ))}
                    <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)}
                      className="h-8 w-10 rounded-lg cursor-pointer bg-transparent border border-gray-300 p-0.5" />
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-200 flex-shrink-0">
              <button type="button" onClick={closeForm}
                className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm">
                Batal
              </button>
              <button type="submit" form="promo-form" disabled={loading}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                {loading
                  ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  : editPromo ? "Simpan Perubahan" : "Simpan Promo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

