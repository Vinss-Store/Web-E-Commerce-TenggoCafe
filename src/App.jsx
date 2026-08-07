import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Produk from "./pages/Produk";
import TambahProduk from "./pages/TambahProduk";
import EditProduk from "./pages/EditProduk";
import Pesanan from "./pages/Pesanan";
import Promo from "./pages/Promo";
import Kategori from "./pages/Kategori";
import Ongkir from "./pages/Ongkir";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/produk"
          element={
            <ProtectedRoute>
              <Produk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tambah-produk"
          element={
            <ProtectedRoute>
              <TambahProduk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-produk/:id"
          element={
            <ProtectedRoute>
              <EditProduk />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pesanan"
          element={
            <ProtectedRoute>
              <Pesanan />
            </ProtectedRoute>
          }
        />
        <Route
          path="/promo"
          element={
            <ProtectedRoute>
              <Promo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kategori"
          element={
            <ProtectedRoute>
              <Kategori />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ongkir"
          element={
            <ProtectedRoute>
              <Ongkir />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

