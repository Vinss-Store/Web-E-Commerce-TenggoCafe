import { useEffect, useState } from "react";
import { FaLayerGroup, FaTrash, FaPlus, FaTimes } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

const iconColors = [
  "bg-amber-500/10 border-amber-500/20 text-amber-400",
  "bg-blue-500/10 border-blue-500/20 text-blue-400",
  "bg-green-500/10 border-green-500/20 text-green-400",
  "bg-purple-500/10 border-purple-500/20 text-purple-400",
  "bg-pink-500/10 border-pink-500/20 text-pink-400",
  "bg-orange-500/10 border-orange-500/20 text-orange-400",
];

export default function Kategori() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchCategories(); }, []);

  async function fetchCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

  async function saveCategory(e) {
    e.preventDefault();
    setLoading(true);
    await supabase.from("categories").insert([{
      label: e.target.label.value,
      icon_name: e.target.icon.value,
    }]);
    e.target.reset();
    setLoading(false);
    setShowForm(false);
    fetchCategories();
  }

  async function deleteCategory(id) {
    if (!confirm("Hapus kategori ini?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Kategori" subtitle="Kelola kategori produk" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <FaLayerGroup className="text-amber-400" />
            </div>
            <div>
              <p className="text-gray-900 font-semibold text-sm">{categories.length} Kategori</p>
              <p className="text-gray-400 text-xs">Semua kategori produk</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className={`flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all ${
              showForm
                ? "bg-gray-100 border border-gray-300 text-gray-700 hover:bg-gray-200"
                : "bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20"
            }`}
          >
            {showForm ? <><FaTimes className="text-xs" /> Tutup</> : <><FaPlus className="text-xs" /> Tambah Kategori</>}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold">Kategori Baru</h3>
              <p className="text-gray-400 text-sm mt-0.5">Tambahkan kategori untuk mengelompokkan produk</p>
            </div>
            <form onSubmit={saveCategory} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Nama Kategori</label>
                  <input type="text" name="label" placeholder="Minuman Panas" required
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Nama Icon</label>
                  <input type="text" name="icon" placeholder="FaCoffee"
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm">
                  Batal
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-sm">
                  {loading ? <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" /> : "Simpan Kategori"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Category Grid */}
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center mb-5">
              <FaLayerGroup className="text-gray-400 text-3xl" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Belum ada kategori</p>
            <p className="text-gray-400 text-sm mt-1">Tambahkan kategori untuk mengelompokkan produk</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {categories.map((item, index) => {
              const colorClass = iconColors[index % iconColors.length];
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-gray-300 hover:shadow-lg hover:shadow-black/20 transition-all group relative"
                >
                  <button
                    onClick={() => deleteCategory(item.id)}
                    className="absolute top-3 right-3 w-7 h-7 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <FaTrash className="text-xs" />
                  </button>

                  <div className={`w-11 h-11 ${colorClass} border rounded-xl flex items-center justify-center mb-4`}>
                    <FaLayerGroup className="text-lg" />
                  </div>

                  <h3 className="text-gray-900 font-semibold text-sm leading-tight">{item.label}</h3>
                  {item.icon_name && (
                    <p className="text-gray-400 text-xs mt-1.5 font-mono bg-gray-100 px-2 py-0.5 rounded-md inline-block">
                      {item.icon_name}
                    </p>
                  )}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-400 text-xs">ID #{item.id}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

