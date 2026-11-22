import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const Login = () => {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError("")

        try {
            await signInWithPopup(auth, googleProvider);
            // Setelah login berhasil, AuthContext akan detect perubahan
            // dan App.jsx akan auto-redirect ke dashboard


        } catch (err) {
            console.log("Login Error", err);

            if (err.code === "auth/popup-closed-by-user") {
                setError("Login Dibatalkan. silakan coba lagi")
            } else if (err.code === "auth/popup-blocked") {
                setError("popup diblokir browser. Izinkan popup untuk situs ini")
            } else {
                setError("Gagal Login silakan Coba lagi")
            }
        } finally {
            setLoading(false)
        }
    };


    return (
        <div className="min-h-screen bg-[#F3F6F8] flex items-center justify-center font-sans">
            <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-sm text-center">

                {/* Logo */}
                <div className="w-16 h-16 bg-[#C5A46D] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-6">
                    ⚓
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-[#0B1F33] tracking-widest">
                    LEGALITA
                </h1>
                <p className="text-xs text-blue-400 tracking-[3px] mt-1 mb-8">
                    CORPORATE WORKSPACE
                </p>

                <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                    Masuk dengan akun Google yang sudah terdaftar untuk mengakses workspace tim.
                </p>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Google Login Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 border border-gray-200 px-5 py-3.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {/* Google Icon SVG */}
                    <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.6-.4-3.9z" />
                        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                        <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.3C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z" />
                        <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C37 38.4 44 33 44 24c0-1.3-.2-2.6-.4-3.9z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                        {loading ? "Memproses..." : "Masuk dengan Google"}
                    </span>
                </button>

                <p className="text-xs text-gray-400 mt-6">
                    Hanya akun tim yang terdaftar yang dapat masuk.
                </p>
                <p className="text-xs text-gray-300 mt-2">
                    © 2026 LEGALITA. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default Login;
