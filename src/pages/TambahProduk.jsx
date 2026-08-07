import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUpload, FaCheckCircle, FaTimes, FaStar } from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

const MAX_PHOTOS = 5;

export default function TambahProduk() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Multi-photo state
  const [photos, setPhotos] = useState([]); // [{ file, preview }]
  const [primaryIndex, setPrimaryIndex] = useState(0); // foto utama

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  }

  function handlePhotosChange(e) {
    const files = Array.from(e.target.files);
    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...toAdd]);
    // reset input agar bisa pilih file yang sama lagi
    e.target.value = "";
  }

  function removePhoto(index) {
    setPhotos((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (primaryIndex >= next.length) setPrimaryIndex(0);
      return next;
    });
  }

  async function saveProduct(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Upload semua foto
    const uploadedUrls = [];
    for (const photo of photos) {
      const fileName = Date.now() + "_" + Math.random().toString(36).slice(2) + "_" + photo.file.name.replace(/\s+/g, "_");
      const { error: uploadError } = await supabase.storage
        .from("product")
        .upload(fileName, photo.file, { upsert: true });

      if (uploadError) {
        setError("Gagal upload foto: " + uploadError.message);
        setLoading(false);
        return;
      }
      const url = supabase.storage.from("product").getPublicUrl(fileName).data.publicUrl;
      uploadedUrls.push(url);
    }

    // Foto utama = index primaryIndex, sisanya jadi array images
    const imageUrl = uploadedUrls[primaryIndex] || uploadedUrls[0] || "";
    // Simpan semua URL di kolom images (termasuk foto utama)
    const allImages = [...uploadedUrls];

    const { error: insertError } = await supabase.from("products").insert([{
      name: e.target.name.value,
      price: parseInt(e.target.price.value),
      stock: parseInt(e.target.stock.value),
      category_id: parseInt(e.target.category.value) || null,
      image_url: imageUrl,
      images: allImages,
      description: e.target.description.value,
    }]);

    setLoading(false);
    if (insertError) { setError("Gagal simpan: " + insertError.message); return; }

    setSuccess(true);
    setTimeout(() => navigate("/produk"), 1200);
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Tambah Produk" subtitle="Tambahkan produk baru ke menu" />

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
              <p className="text-green-400 font-medium text-sm">Produk berhasil ditambahkan! Mengalihkan...</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-200">
              <h2 className="text-gray-900 font-semibold">Informasi Produk</h2>
              <p className="text-gray-400 text-sm mt-0.5">Isi semua detail produk dengan lengkap</p>
            </div>

            <form onSubmit={saveProduct} className="p-8 flex flex-col gap-6">

              {/* ── Multi Photo Upload ── */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-sm font-medium text-gray-500">
                    Foto Produk
                    <span className="text-gray-400 font-normal ml-1">(maks. {MAX_PHOTOS} foto)</span>
                  </label>
                  <span className="text-xs text-gray-400">{photos.length}/{MAX_PHOTOS}</span>
                </div>

                {/* Preview grid */}
                {photos.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {photos.map((p, i) => (
                      <div key={i} className="relative group aspect-square">
                        <img
                          src={p.preview}
                          alt={`foto-${i}`}
                          className={`w-full h-full object-cover rounded-xl border-2 transition-all cursor-pointer
                            ${primaryIndex === i ? "border-amber-500" : "border-gray-300 hover:border-zinc-500"}`}
                          onClick={() => setPrimaryIndex(i)}
                        />
                        {/* Badge utama */}
                        {primaryIndex === i && (
                          <div className="absolute top-1 left-1 bg-amber-500 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                            <FaStar className="text-black text-[8px]" />
                            <span className="text-black text-[9px] font-bold">Utama</span>
                          </div>
                        )}
                        {/* Tombol hapus */}
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <FaTimes className="text-gray-900 text-[8px]" />
                        </button>
                      </div>
                    ))}

                    {/* Slot tambah foto */}
                    {photos.length < MAX_PHOTOS && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 hover:border-amber-500/40 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all">
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
                        <FaUpload className="text-gray-400 text-sm mb-1" />
                        <span className="text-gray-400 text-[10px]">Tambah</span>
                      </label>
                    )}
                  </div>
                )}

                {/* Upload area awal (saat belum ada foto) */}
                {photos.length === 0 && (
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotosChange} />
                    <div className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-amber-500/40 h-44 flex flex-col items-center justify-center transition-all">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
                        <FaUpload className="text-gray-400 text-lg" />
                      </div>
                      <p className="text-gray-500 text-sm font-medium">Klik untuk upload foto</p>
                      <p className="text-gray-400 text-xs mt-1">Pilih hingga {MAX_PHOTOS} foto sekaligus • PNG, JPG</p>
                    </div>
                  </label>
                )}

                {photos.length > 1 && (
                  <p className="text-gray-400 text-xs mt-2">
                    Klik foto untuk dijadikan foto utama produk
                  </p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Nama Produk <span className="text-red-400">*</span></label>
                <input
                  type="text" name="name" placeholder="Contoh: Kopi Susu Gula Aren" required
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Harga (Rp) <span className="text-red-400">*</span></label>
                  <input
                    type="number" name="price" placeholder="25000" required
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Stok <span className="text-red-400">*</span></label>
                  <input
                    type="number" name="stock" placeholder="100" required
                    className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Kategori</label>
                <select
                  name="category"
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
                  name="description" placeholder="Deskripsi singkat produk..." rows={3}
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
                  ) : "Simpan Produk"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

