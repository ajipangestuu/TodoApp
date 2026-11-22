import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Todo from "./Components/Todo";
import Login from "./Components/Login";

const AppContent = () => {
  const { user, loading, isAllowed, logout } = useAuth();

  // Loading spinner saat cek auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F3F6F8] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#C5A46D] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
            ⚓
          </div>
          <p className="text-sm text-gray-500">Memuat workspace...</p>
        </div>
      </div>
    );
  }

  // Belum login → halaman login
  if (!user) return <Login />;

  // Login tapi email tidak di whitelist
  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-[#F3F6F8] flex items-center justify-center font-sans">
        <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-xl font-bold text-[#0B1F33] mb-2">Akses Ditolak</h2>
          <p className="text-sm text-gray-500 mb-6">
            Akun <strong>{user.email}</strong> tidak terdaftar dalam sistem.
            Hubungi administrator.
          </p>
          <button
            onClick={logout}
            className="text-sm text-red-500 hover:underline"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  // Login + allowed → dashboard
  return <Todo />;
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;