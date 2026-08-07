import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import { supabase } from "../services/supabase";

import bgLeft from "../assets/login.png";
import bgRight from "../assets/login2.png";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen flex relative">
      {/* ── Left Panel ── */}
      <div
        className="hidden lg:flex w-1/2 relative flex-col items-center justify-center p-12 pr-16"
        style={{
          backgroundImage: `url(${bgLeft})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/40">
            <span className="text-black text-4xl font-black">T</span>
          </div>
          <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">
            Tenggo<br />
            <span className="text-amber-400">Caffe</span>
          </h1>
          <p className="text-gray-700 text-base leading-relaxed">
            Panel admin untuk mengelola produk, pesanan, promo, dan kategori kafe Anda.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-4">
            {[
              { label: "Produk", value: "50+" },
              { label: "Pesanan", value: "200+" },
              { label: "Promo", value: "10+" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              >
                <p className="text-amber-400 text-2xl font-bold">{s.value}</p>
                <p className="text-gray-700 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="hidden lg:block absolute left-1/2 top-0 h-full z-20 -translate-x-1/2 pointer-events-none">
        <div className="w-6 h-full bg-black" />
      </div>

      {/* ── Right Panel ── */}
      <div
        className="flex-1 relative flex items-center justify-center p-8"
        style={{
          backgroundImage: `url(${bgRight})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        {/* Form Card */}
        <div className="relative z-10 w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
              <span className="text-black font-black text-lg">T</span>
            </div>
            <span className="text-gray-900 font-bold text-xl">Tenggo Caffe</span>
          </div>

          {/* Card */}
          <div className="bg-white backdrop-blur-md border border-gray-300/60 rounded-3xl p-8 shadow-2xl">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Selamat datang</h2>
              <p className="text-gray-500 mt-2 text-sm">Masuk ke panel admin Anda</p>
            </div>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="email"
                    name="email"
                    placeholder="admin@tenggo.com"
                    required
                    className="w-full bg-gray-100/80 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-100/80 border border-gray-300 text-gray-900 placeholder-zinc-600 rounded-xl pl-11 pr-4 py-3.5 text-sm outline-none focus:border-amber-500/70 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-1 shadow-lg shadow-amber-500/30"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Masuk...
                  </>
                ) : (
                  "Masuk"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

