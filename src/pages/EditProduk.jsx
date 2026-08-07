import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaUpload, FaCheckCircle } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

export default function EditProduk() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category_id: "",
    description: "",
    image_url: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setFetching(true);
    const [{ data: product }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).single(),
      supabase.from("categories").select("*"),
    ]);

    if (product) {
      setForm({
        name: product.name || "",
        price: product.price || "",
        stock: product.stock || "",
        category_id: product.category_id || "",
        description: product.description || "",
        image_url: product.image_url || "",
      });
      if (product.image_url) setPreview(product.image_url);
    }

    setCategories(cats || []);
    setFetching(false);
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  }

  async function saveProduct(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const file = e.target.image.files[0];
    let imageUrl = form.image_url;

    if (file) {
      const fileName = Date.now() + "_" + file.name.replace(/\s+/g, "_");
      const { error: uploadError } = await supabase.storage
        .from("product")
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        setError("Gagal upload gambar: " + uploadError.message);
        setLoading(false);
        return;
      }
      imageUrl = supabase.storage.from("product").getPublicUrl(fileName).data.publicUrl;
    }

    const { error: updateError } = await supabase
      .from("products")
      .update({
        name: e.target.name.value,
        price: parseInt(e.target.price.value),
        stock: parseInt(e.target.stock.value),
        category_id: parseInt(e.target.category.value) || null,
        image_url: imageUrl,
        description: e.target.description.value,
      })
      .eq("id", id);

    setLoading(false);

    if (updateError) {
      setError("Gagal update: " + updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => navigate("/produk"), 1200);
  }

  if (fetching) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Memuat data produk...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Edit Produk" subtitle="Perbarui informasi produk" />

        <div className="max-w-2xl">
          <button
            onClick={() => navigate("/produk")}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-900 text-sm mb-6 transition-colors group"
          >
            <FaArrowLeft className="text-xs group-hover:-translate-x-0.5 transition-transform" />
            Kembali ke Produk
          </button>

          {success && (
            <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-4 mb-6">
              <FaCheckCircle className="text-green-400 text-lg" />
              <p className="text-green-400 font-medium text-sm">Produk berhasil diperbarui! Mengalihkan...</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            {/* Card Header */}
            <div className="px-8 py-5 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-gray-900 font-semibold">Edit Produk</h2>
                <p className="text-gray-400 text-sm mt-0.5">ID #{id}</p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full">
                Mode Edit
              </span>
            </div>

            <form onSubmit={saveProduct} className="p-8 flex flex-col gap-6">
              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2.5 block">Foto Produk</label>
                <label className="cursor-pointer block">
                  <input
                    type="file" name="image" accept="image/*"
                    className="hidden" onChange={handleImageChange}
                  />
                  <div className={`w-full rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden
                    ${preview ? "border-amber-500/40 h-56" : "border-gray-300 hover:border-amber-500/40 h-44"}`}>
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-3 p-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <FaUpload className="text-gray-400 text-lg" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-500 text-sm font-medium">Klik untuk ganti foto</p>
                          <p className="text-gray-400 text-xs mt-1">PNG, JPG hingga 5MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </label>
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setForm((f) => ({ ...f, image_url: "" })); }}
                    className="text-xs text-gray-400 hover:text-red-400 mt-2 transition-colors"
                  >
                    Hapus foto
                  </button>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Nama Produk <span className="text-red-400">*</span>
                </label>
                <input
                  type="text" name="name" required
                  defaultValue={form.name}
                  placeholder="Contoh: Kopi Susu Gula Aren"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Harga (Rp) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number" name="price" required
                    defaultValue={form.price}
                    placeholder="25000"
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">
                    Stok <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number" name="stock" required
                    defaultValue={form.stock}
                    placeholder="100"
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Kategori</label>
                <select
                  name="category"
                  defaultValue={form.category_id}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>{item.label}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Deskripsi</label>
                <textarea
                  name="description"
                  defaultValue={form.description}
                  placeholder="Deskripsi singkat produk..."
                  rows={3}
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all resize-none"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button" onClick={() => navigate("/produk")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit" disabled={loading}
                  className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 text-black font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                  ) : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

