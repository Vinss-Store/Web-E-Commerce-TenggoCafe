import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaBox, FaSearch, FaSync, FaEdit } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

export default function Produk() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => { fetchProducts(); }, []);

  async function fetchProducts() {
    setLoading(true);
    const { data } = await supabase.from("products").select("*");
    setProducts(data || []);
    setLoading(false);
  }

  async function deleteProduct(id) {
    if (!confirm("Hapus produk ini?")) return;
    const product = products.find((p) => p.id === id);
    if (product?.image_url?.includes("/storage/v1/object/public/product/")) {
      const fileName = product.image_url.split("/product/")[1];
      await supabase.storage.from("product").remove([fileName]);
    }
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  }

  const filtered = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Produk" subtitle="Kelola semua produk kafe" />

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5">
              <FaSearch className="text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-900 placeholder-zinc-600 outline-none w-44"
              />
            </div>
            <button
              onClick={fetchProducts}
              className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 hover:text-amber-400 hover:border-amber-500/40 transition-all"
            >
              <FaSync className="text-xs" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{filtered.length} produk</span>
            <Link
              to="/tambah-produk"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <FaPlus className="text-xs" />
              Tambah Produk
            </Link>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-100" />
                <div className="p-5 flex flex-col gap-3">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="w-20 h-20 bg-white border border-gray-200 rounded-3xl flex items-center justify-center mb-5">
              <FaBox className="text-gray-400 text-3xl" />
            </div>
            <p className="text-gray-700 font-semibold text-lg">Belum ada produk</p>
            <p className="text-gray-400 text-sm mt-1 mb-6">Tambahkan produk pertama Anda ke menu</p>
            <Link
              to="/tambah-produk"
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-5 py-2.5 rounded-xl transition-all"
            >
              <FaPlus className="text-xs" /> Tambah Produk
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:border-gray-300 hover:shadow-xl hover:shadow-black/30 transition-all duration-300 group"
              >
                {/* Image */}
                <div className="relative overflow-hidden h-52">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <FaBox className="text-gray-400 text-3xl" />
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  {/* Stock badge */}
                  <div className="absolute top-3 right-3">
                    <span className="bg-black/60 backdrop-blur-sm text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                      Stok: {item.stock ?? "—"}
                    </span>
                  </div>
                  {/* Price on image */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-gray-900 font-bold text-base drop-shadow-lg">
                      Rp {item.price?.toLocaleString("id-ID")}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-gray-900 font-semibold text-base leading-tight">{item.name}</h3>
                  {item.description && (
                    <p className="text-gray-400 text-xs mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  )}

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
                    <span className="text-gray-400 text-xs font-mono">ID #{item.id}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/edit-produk/${item.id}`)}
                        className="flex items-center gap-1.5 text-xs bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <FaEdit className="text-xs" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(item.id)}
                        className="flex items-center gap-1.5 text-xs bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 px-3 py-1.5 rounded-lg transition-all"
                      >
                        <FaTrash className="text-xs" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

