import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaCoffee,
  FaClipboardList,
  FaTags,
  FaLayerGroup,
  FaPlus,
  FaSignOutAlt,
  FaMotorcycle,
} from "react-icons/fa";
import { supabase } from "../services/supabase";

const menus = [
  { name: "Dashboard", path: "/", icon: FaHome },
  { name: "Produk", path: "/produk", icon: FaCoffee },
  { name: "Tambah Produk", path: "/tambah-produk", icon: FaPlus },
  { name: "Pesanan", path: "/pesanan", icon: FaClipboardList },
  { name: "Promo", path: "/promo", icon: FaTags },
  { name: "Kategori", path: "/kategori", icon: FaLayerGroup },
  { name: "Ongkos Kirim", path: "/ongkir", icon: FaMotorcycle },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <FaCoffee className="text-gray-900 text-lg" />
          </div>
          <div>
            <h1 className="text-gray-900 font-bold text-lg leading-none">Tenggo</h1>
            <p className="text-amber-500 text-xs font-medium tracking-widest uppercase">Caffe</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active = location.pathname === menu.path;
          return (
            <Link
              key={menu.path}
              to={menu.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20"
                  : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              <Icon className={`text-base ${active ? "text-gray-900" : ""}`} />
              {menu.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <FaSignOutAlt />
          Keluar
        </button>
      </div>
    </div>
  );
}

