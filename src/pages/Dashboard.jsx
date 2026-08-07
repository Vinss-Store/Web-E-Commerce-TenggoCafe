import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  FaMoneyBillWave,
  FaShoppingCart,
  FaBox,
  FaCheckCircle,
  FaMotorcycle,
  FaArrowUp,
} from "react-icons/fa";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { supabase } from "../services/supabase";

ChartJS.register(
  CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, Title, Tooltip, Legend, Filler
);

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#ffffffff",
      borderColor: "#3f3f46",
      borderWidth: 1,
      titleColor: "#a1a1aa",
      bodyColor: "#ffffff",
      padding: 12,
      callbacks: {
        label: (ctx) => " Rp " + ctx.raw.toLocaleString("id-ID"),
      },
    },
  },
  scales: {
    x: {
      grid: { color: "#27272a" },
      ticks: { color: "#71717a", font: { size: 11 } },
    },
    y: {
      grid: { color: "#27272a" },
      ticks: {
        color: "#71717a",
        font: { size: 11 },
        callback: (v) => "Rp " + (v / 1000).toFixed(0) + "k",
      },
    },
  },
};

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#18181b",
      borderColor: "#3f3f46",
      borderWidth: 1,
      titleColor: "#a1a1aa",
      bodyColor: "#ffffff",
      padding: 12,
    },
  },
  scales: {
    x: {
      grid: { color: "#27272a" },
      ticks: { color: "#71717a", font: { size: 11 } },
    },
    y: {
      grid: { color: "#27272a" },
      ticks: { color: "#71717a", font: { size: 11 } },
    },
  },
};

const statusConfig = {
  Selesai: "bg-green-500/10 text-green-400 border-green-500/20",
  "Sedang Diantar": "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [grossRevenue, setGrossRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [chartData, setChartData] = useState(null);
  const [barData, setBarData] = useState(null);

  useEffect(() => { fetchDashboard(); }, []);

  async function fetchDashboard() {
    const [{ data: ordersData }, { data: productsData }] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: true }),
      supabase.from("products").select("*"),
    ]);

    const oList = ordersData || [];
    const pList = productsData || [];

    setOrders(oList);
    setProducts(pList);

    let total = 0;
    oList.forEach((item) => { total += item.total_price || 0; });
    setGrossRevenue(total);
    setTotalOrders(oList.length);

    const days = [], revenues = [], orderCounts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric" });
      const dateStr = d.toISOString().split("T")[0];
      const dayOrders = oList.filter((o) => o.created_at?.startsWith(dateStr));
      days.push(label);
      revenues.push(dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0));
      orderCounts.push(dayOrders.length);
    }

    setChartData({
      labels: days,
      datasets: [{
        data: revenues,
        borderColor: "#f59e0b",
        backgroundColor: "rgba(245,158,11,0.08)",
        borderWidth: 2.5,
        pointBackgroundColor: "#f59e0b",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }],
    });

    setBarData({
      labels: days,
      datasets: [{
        data: orderCounts,
        backgroundColor: "rgba(245,158,11,0.65)",
        hoverBackgroundColor: "#f59e0b",
        borderRadius: 8,
        borderSkipped: false,
      }],
    });
  }

  const recentOrders = [...orders].reverse().slice(0, 5);
  const selesai = orders.filter((o) => o.status === "Selesai").length;
  const diantar = orders.filter((o) => o.status === "Sedang Diantar").length;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-8 overflow-auto">
        <Navbar title="Dashboard" subtitle="Selamat datang kembali, Admin 👋" />

        {/* ── Stats ── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            {
              title: "Total Revenue",
              value: `Rp ${grossRevenue.toLocaleString("id-ID")}`,
              icon: FaMoneyBillWave,
              color: "amber",
              sub: "Semua waktu",
            },
            {
              title: "Total Pesanan",
              value: totalOrders,
              icon: FaShoppingCart,
              color: "blue",
              sub: `${diantar} sedang diantar`,
            },
            {
              title: "Selesai",
              value: selesai,
              icon: FaCheckCircle,
              color: "green",
              sub: "Pesanan selesai",
            },
            {
              title: "Total Produk",
              value: products.length,
              icon: FaBox,
              color: "purple",
              sub: "Produk aktif",
            },
          ].map((s) => {
            const colorMap = {
              amber: { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-400", val: "text-amber-400" },
              blue:  { bg: "bg-blue-500/10",  border: "border-blue-500/20",  icon: "text-blue-400",  val: "text-gray-900" },
              green: { bg: "bg-green-500/10", border: "border-green-500/20", icon: "text-green-400", val: "text-gray-900" },
              purple:{ bg: "bg-purple-500/10",border: "border-purple-500/20",icon: "text-purple-400",val: "text-gray-900" },
            };
            const c = colorMap[s.color];
            const Icon = s.icon;
            return (
              <div key={s.title} className={`bg-white border ${c.border} rounded-2xl p-5 hover:shadow-lg hover:shadow-black/20 transition-all`}>
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 ${c.bg} border ${c.border} rounded-xl flex items-center justify-center`}>
                    <Icon className={`${c.icon} text-base`} />
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">
                    <FaArrowUp className="text-[10px]" /> Live
                  </span>
                </div>
                <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">{s.title}</p>
                <p className={`text-2xl font-bold mt-1 ${c.val}`}>{s.value}</p>
                <p className="text-gray-400 text-xs mt-1">{s.sub}</p>
              </div>
            );
          })}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Line Chart */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-gray-900 font-semibold">Grafik Revenue</h2>
                <p className="text-gray-400 text-xs mt-0.5">Pendapatan 7 hari terakhir</p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full font-medium">
                7 Hari
              </span>
            </div>
            <div className="h-52">
              {chartData ? (
                <Line data={chartData} options={lineOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="mb-5">
              <h2 className="text-gray-900 font-semibold">Jumlah Order</h2>
              <p className="text-gray-400 text-xs mt-0.5">Per hari (7 hari)</p>
            </div>
            <div className="h-52">
              {barData ? (
                <Bar data={barData} options={barOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Recent Orders ── */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div>
              <h2 className="text-gray-900 font-semibold">Pesanan Terbaru</h2>
              <p className="text-gray-400 text-xs mt-0.5">5 pesanan terakhir masuk</p>
            </div>
            <span className="text-xs bg-gray-100 border border-gray-300 text-gray-500 px-3 py-1 rounded-full">
              {recentOrders.length} pesanan
            </span>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Order ID</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Total</th>
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/40">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-gray-400 py-10 text-sm">
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                recentOrders.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3.5 text-sm font-mono font-semibold text-gray-700">#{item.id}</td>
                    <td className="px-6 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig[item.status] || "bg-gray-100 text-gray-500 border-gray-300"}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status || "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900">
                      Rp {item.total_price?.toLocaleString("id-ID") ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-400">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

