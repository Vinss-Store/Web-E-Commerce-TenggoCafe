import { useEffect, useState } from "react";
import {
  FaMotorcycle, FaPlus, FaTimes, FaEdit, FaTrash,
  FaChevronDown, FaChevronRight, FaSearch,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

export default function Ongkir() {
  const [cities, setCities] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedCity, setExpandedCity] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal kota
  const [showCityModal, setShowCityModal] = useState(false);
  const [editCity, setEditCity] = useState(null); // null = tambah baru

  // Modal kecamatan
  const [showDistrictModal, setShowDistrictModal] = useState(false);
  const [editDistrict, setEditDistrict] = useState(null);
  const [districtCityId, setDistrictCityId] = useState(null);

  useEffect(() => { fetchCities(); }, []);

  async function fetchCities() {
    setLoading(true);
    const { data } = await supabase
      .from("shipping_cities")
      .select("*, shipping_districts(*)")
      .order("name");
    setCities(data || []);
    setLoading(false);
  }

  // ── KOTA ──
  async function saveCity(e) {
    e.preventDefault();
    const name = e.target.city_name.value.trim();
    const base_fee = parseInt(e.target.base_fee.value) || 0;

    if (editCity) {
      await supabase.from("shipping_cities").update({ name, base_fee }).eq("id", editCity.id);
    } else {
      await supabase.from("shipping_cities").insert([{ name, base_fee }]);
    }
    setShowCityModal(false);
    setEditCity(null);
    fetchCities();
  }

  async function deleteCity(id) {
    if (!confirm("Hapus kota ini beserta semua kecamatannya?")) return;
    await supabase.from("shipping_cities").delete().eq("id", id);
    fetchCities();
  }

  // ── KECAMATAN ──
  async function saveDistrict(e) {
    e.preventDefault();
    const name = e.target.district_name.value.trim();
    const fee = parseInt(e.target.fee.value) || 0;

    if (editDistrict) {
      await supabase.from("shipping_districts").update({ name, fee }).eq("id", editDistrict.id);
    } else {
      await supabase.from("shipping_districts").insert([{ name, fee, city_id: districtCityId }]);
    }
    setShowDistrictModal(false);
    setEditDistrict(null);
    fetchCities();
  }

  async function deleteDistrict(id) {
    if (!confirm("Hapus kecamatan ini?")) return;
    await supabase.from("shipping_districts").delete().eq("id", id);
    fetchCities();
  }

  const filtered = cities.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalDistricts = cities.reduce((s, c) => s + (c.shipping_districts?.length || 0), 0);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Ongkos Kirim" subtitle="Kelola tarif pengiriman per kota & kecamatan" />

        {/* ── Summary ── */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <FaMotorcycle className="text-amber-400 text-xl" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Kota</p>
              <p className="text-gray-900 text-2xl font-bold mt-0.5">{cities.length}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <FaMotorcycle className="text-blue-400 text-xl" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Total Kecamatan</p>
              <p className="text-gray-900 text-2xl font-bold mt-0.5">{totalDistricts}</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center">
              <FaMotorcycle className="text-green-400 text-xl" />
            </div>
            <div>
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Rata-rata Ongkir</p>
              <p className="text-gray-900 text-2xl font-bold mt-0.5">
                {totalDistricts > 0
                  ? "Rp " + Math.round(
                      cities.flatMap((c) => c.shipping_districts || []).reduce((s, d) => s + d.fee, 0) / totalDistricts
                    ).toLocaleString("id-ID")
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        {/* ── Table Card ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 border border-gray-300 rounded-xl px-3 py-2">
              <FaSearch className="text-gray-400 text-xs" />
              <input
                type="text"
                placeholder="Cari kota..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-900 placeholder-zinc-600 outline-none w-40"
              />
            </div>
            <button
              onClick={() => { setEditCity(null); setShowCityModal(true); }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20"
            >
              <FaPlus className="text-xs" /> Tambah Kota
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <FaMotorcycle className="text-gray-400 text-2xl" />
              </div>
              <p className="text-gray-500 font-medium">Belum ada kota</p>
              <p className="text-gray-400 text-sm mt-1">Tambahkan kota pengiriman pertama</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filtered.map((city) => {
                const isExpanded = expandedCity === city.id;
                const districts = city.shipping_districts || [];
                return (
                  <div key={city.id}>
                    {/* City row */}
                    <div
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                      onClick={() => setExpandedCity(isExpanded ? null : city.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 flex items-center justify-center text-gray-400">
                          {isExpanded
                            ? <FaChevronDown className="text-amber-400 text-xs" />
                            : <FaChevronRight className="text-xs" />}
                        </div>
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{city.name}</p>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {districts.length} kecamatan
                            {city.base_fee > 0 && ` • Base fee Rp ${city.base_fee.toLocaleString("id-ID")}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { setDistrictCityId(city.id); setEditDistrict(null); setShowDistrictModal(true); }}
                          className="flex items-center gap-1.5 text-xs bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg transition-all"
                        >
                          <FaPlus className="text-[10px]" /> Kecamatan
                        </button>
                        <button
                          onClick={() => { setEditCity(city); setShowCityModal(true); }}
                          className="w-8 h-8 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"
                        >
                          <FaEdit className="text-xs" />
                        </button>
                        <button
                          onClick={() => deleteCity(city.id)}
                          className="w-8 h-8 bg-gray-100 hover:bg-red-500/10 border border-gray-300 hover:border-red-500/20 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition-all"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>

                    {/* Districts */}
                    {isExpanded && (
                      <div className="bg-gray-50 border-t border-gray-200">
                        {districts.length === 0 ? (
                          <div className="px-16 py-5 text-gray-400 text-sm">
                            Belum ada kecamatan —{" "}
                            <button
                              onClick={() => { setDistrictCityId(city.id); setEditDistrict(null); setShowDistrictModal(true); }}
                              className="text-amber-500 hover:underline"
                            >tambah sekarang</button>
                          </div>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider pl-16 pr-6 py-2.5">Kecamatan</th>
                                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-2.5">Ongkir</th>
                                <th className="px-6 py-2.5" />
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800/30">
                              {districts.map((d) => (
                                <tr key={d.id} className="group/row hover:bg-gray-100/10 transition-colors">
                                  <td className="pl-16 pr-6 py-3">
                                    <span className="text-gray-700 text-sm">{d.name}</span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <span className="text-amber-400 text-sm font-semibold">
                                      Rp {d.fee.toLocaleString("id-ID")}
                                    </span>
                                  </td>
                                  <td className="px-6 py-3">
                                    <div className="flex items-center gap-2 justify-end opacity-0 group-hover/row:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => { setEditDistrict(d); setDistrictCityId(city.id); setShowDistrictModal(true); }}
                                        className="w-7 h-7 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all"
                                      >
                                        <FaEdit className="text-[10px]" />
                                      </button>
                                      <button
                                        onClick={() => deleteDistrict(d.id)}
                                        className="w-7 h-7 bg-gray-100 hover:bg-red-500/10 border border-gray-300 hover:border-red-500/20 rounded-lg flex items-center justify-center text-gray-500 hover:text-red-400 transition-all"
                                      >
                                        <FaTrash className="text-[10px]" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Kota ── */}
      {showCityModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold">{editCity ? "Edit Kota" : "Tambah Kota"}</h3>
              <button onClick={() => { setShowCityModal(false); setEditCity(null); }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all">
                <FaTimes className="text-xs" />
              </button>
            </div>
            <form onSubmit={saveCity} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Nama Kota / Kabupaten</label>
                <input
                  type="text" name="city_name" required
                  defaultValue={editCity?.name || ""}
                  placeholder="Contoh: Kota Makassar"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Base Fee (Rp)
                  <span className="text-gray-400 font-normal ml-1">— opsional, tambahan dari ongkir kecamatan</span>
                </label>
                <input
                  type="number" name="base_fee" min="0"
                  defaultValue={editCity?.base_fee || 0}
                  placeholder="0"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowCityModal(false); setEditCity(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all text-sm">
                  {editCity ? "Simpan Perubahan" : "Tambah Kota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Kecamatan ── */}
      {showDistrictModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold">{editDistrict ? "Edit Kecamatan" : "Tambah Kecamatan"}</h3>
              <button onClick={() => { setShowDistrictModal(false); setEditDistrict(null); }}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all">
                <FaTimes className="text-xs" />
              </button>
            </div>
            <form onSubmit={saveDistrict} className="p-6 flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Nama Kecamatan</label>
                <input
                  type="text" name="district_name" required
                  defaultValue={editDistrict?.name || ""}
                  placeholder="Contoh: Tamalate"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">Ongkos Kirim (Rp)</label>
                <input
                  type="number" name="fee" required min="0"
                  defaultValue={editDistrict?.fee || ""}
                  placeholder="Contoh: 10000"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500/60 transition-all"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => { setShowDistrictModal(false); setEditDistrict(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all text-sm">
                  Batal
                </button>
                <button type="submit"
                  className="flex-1 bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 rounded-xl transition-all text-sm">
                  {editDistrict ? "Simpan Perubahan" : "Tambah Kecamatan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

