import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// ⚠️ GANTI dengan email Google asli dari Aji, Nabil, Rocki
const ALLOWED_EMAILS = [
    "wagistop78@gmail.com",       // ← email Google Aji yang sebenarnya
    "nabil@gmail.com",     // ← email Google Nabil yang sebenarnya
    "rocki@gmail.com",     // ← email Google Rocki yang sebenarnya
];

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        // Firebase listener — auto detect login/logout
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const allowed = ALLOWED_EMAILS.includes(currentUser.email);
                setIsAllowed(allowed);
                setUser(currentUser);
            } else {
                setUser(null);
                setIsAllowed(false);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await signOut(auth);
    };

    // Helper: dapatkan nama display berdasarkan email
    const getUserDisplayName = (email) => {
        if (!email) return "User";
        const idx = ALLOWED_EMAILS.indexOf(email);
        const names = ["Aji Pangestu", "Nabil", "Rocki"];
        return names[idx] ?? email.split("@")[0];
    };

    const value = { user, loading, isAllowed, logout, getUserDisplayName };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook — pakai ini di semua komponen
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth harus dipakai dalam AuthProvider");
    return context;
};