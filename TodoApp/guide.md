# 🚀 Guide: Backend & Logic untuk LEGALITA Todo App

> Project: **Vite + React 19 + Tailwind CSS v4**  
> Stack backend: **Firebase (Firestore + Google Auth)**  
> Users: **Aji Pangestu, Nabil, Rocki**

---

## 📋 Daftar Isi

1. [Arsitektur & Overview](#1-arsitektur--overview)
2. [Install Dependencies](#2-install-dependencies)
3. [Setup Firebase Project](#3-setup-firebase-project)
4. [Konfigurasi Firebase di App](#4-konfigurasi-firebase-di-app)
5. [Komponen AuthContext (Global Login State)](#5-komponen-authcontext-global-login-state)
6. [Komponen Login Page](#6-komponen-login-page)
7. [Update App.jsx (Auth Guard)](#7-update-appjsx-auth-guard)
8. [Update Todo.jsx — Full Backend Logic](#8-update-todojsx--full-backend-logic)
9. [Firestore Data Structure](#9-firestore-data-structure)
10. [Rules Firestore (Security)](#10-rules-firestore-security)
11. [Environment Variables (.env)](#11-environment-variables-env)
12. [Alur Kerja Lengkap](#12-alur-kerja-lengkap)

---

## 1. Arsitektur & Overview

```
TodoApp/
├── src/
│   ├── Components/
│   │   ├── Todo.jsx          ← UI + Logic utama (kita update)
│   │   └── Login.jsx         ← Halaman login Google (baru)
│   ├── context/
│   │   └── AuthContext.jsx   ← Global auth state (baru)
│   ├── firebase.js           ← Konfigurasi Firebase (baru)
│   ├── App.jsx               ← Auth Guard (update)
│   └── main.jsx
├── .env                      ← Firebase credentials (baru)
└── guide.md
```

**Flow login:**
```
App start → cek auth state → 
  Belum login → tampil Login.jsx (Google Sign In)
  Sudah login → cek user allowed (Aji/Nabil/Rocki) → 
    Allowed → tampil Todo.jsx
    Not allowed → tampil "Access Denied"
```

---

## 2. Install Dependencies

Buka terminal di folder `TodoApp/TodoApp`, jalankan:

```bash
npm install firebase
```

Package yang diinstall:
- `firebase` → SDK untuk Firestore + Google Auth

---

## 3. Setup Firebase Project

### Langkah-langkah di Firebase Console

1. Buka [https://console.firebase.google.com](https://console.firebase.google.com)
2. Klik **"Add project"** → nama project: `legalita-todo`
3. Disable Google Analytics (opsional) → **Create project**

### Enable Authentication

1. Di sidebar kiri → **Build** → **Authentication**
2. Klik **"Get started"**
3. Tab **"Sign-in method"** → klik **Google** → toggle **Enable**
4. Isi **Project support email** (email lo sendiri)
5. Klik **Save**

### Enable Firestore

1. Di sidebar kiri → **Build** → **Firestore Database**
2. Klik **"Create database"**
3. Pilih **"Start in test mode"** (nanti kita update rules-nya)
4. Pilih region: `asia-southeast1 (Singapore)` → **Enable**

### Ambil Config Firebase

1. Di sidebar → klik ⚙️ **Project Settings**
2. Scroll ke bawah → **"Your apps"** → klik icon **`</>`** (Web app)
3. Register app: nama `legalita-web` → **Register**
4. Copy objek `firebaseConfig` yang muncul — ini yang kita pakai di `.env`

### Whitelist Email 3 User

> **Catatan**: Kita handle whitelist di **kode** (bukan di Firebase console),  
> yaitu dengan mengecek email user yang login di `AuthContext.jsx`.

---

## 4. Konfigurasi Firebase di App

Buat file `src/firebase.js`:

```javascript
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth instance
export const auth = getAuth(app);

// Google Provider
export const googleProvider = new GoogleAuthProvider();
// Paksa user pilih akun setiap login
googleProvider.setCustomParameters({ prompt: "select_account" });

// Firestore instance
export const db = getFirestore(app);

export default app;
```

---

## 5. Komponen AuthContext (Global Login State)

Buat folder `src/context/` lalu file `src/context/AuthContext.jsx`:

```jsx
// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

// ⚠️ GANTI dengan email Google asli dari Aji, Nabil, Rocki
const ALLOWED_EMAILS = [
  "aji@gmail.com",       // ← email Google Aji yang sebenarnya
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
```

> **⚠️ PENTING**: Ganti email di array `ALLOWED_EMAILS` dengan email Google asli  
> dari Aji, Nabil, dan Rocki. Email harus persis sama (case-sensitive).  
> Cara paling mudah: suruh masing-masing user login sekali, lalu cek email  
> yang muncul di **Firebase Console → Authentication → Users**.

---

## 6. Komponen Login Page

Buat file `src/Components/Login.jsx`:

```jsx
// src/Components/Login.jsx
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // Setelah login berhasil, AuthContext akan detect perubahan
      // dan App.jsx akan auto-redirect ke dashboard
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Login dibatalkan. Silakan coba lagi.");
      } else if (err.code === "auth/popup-blocked") {
        setError("Popup diblokir browser. Izinkan popup untuk situs ini.");
      } else {
        setError("Gagal login. Silakan coba lagi.");
      }
    } finally {
      setLoading(false);
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
            <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.2-2.6-.4-3.9z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.1 19 12 24 12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6.5 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5l-6.3-5.3C29.5 35.6 26.9 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>  
            <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.3 5.3C37 38.4 44 33 44 24c0-1.3-.2-2.6-.4-3.9z"/>
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
```

---

## 7. Update App.jsx (Auth Guard)

Replace seluruh isi `src/App.jsx`:

```jsx
// src/App.jsx
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
```

---

## 8. Update Todo.jsx — Full Backend Logic

Replace **seluruh isi** `src/Components/Todo.jsx` dengan kode berikut:

```jsx
// src/Components/Todo.jsx
import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────
// KONSTANTA
// ─────────────────────────────────────────────
const TEAM_MEMBERS = [
  { name: "Aji Pangestu", initials: "A", role: "Client Relations & IT",  color: "bg-blue-100 text-blue-800" },
  { name: "Nabil",        initials: "N", role: "Technical Operations",    color: "bg-amber-100 text-amber-800" },
  { name: "Rocki",        initials: "R", role: "Technical & Supervisor",  color: "bg-emerald-100 text-emerald-800" },
];

const CATEGORIES = ["Regulatory", "Technical", "EXIM", "Administration", "Legal"];

const STATUS_CONFIG = {
  "Pending":     { color: "bg-gray-100 text-gray-600" },
  "In Progress": { color: "bg-amber-100 text-amber-700" },
  "Completed":   { color: "bg-emerald-100 text-emerald-700" },
  "Overdue":     { color: "bg-red-100 text-red-700" },
};

// ─────────────────────────────────────────────
// HELPER
// ─────────────────────────────────────────────
const getMemberShort = (fullName) => fullName?.split(" ")[0] ?? fullName;

const getMemberInfo = (name) =>
  TEAM_MEMBERS.find((m) => m.name === name || getMemberShort(m.name) === name);

const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  if (typeof dateVal === "string") {
    // Format dari input date (YYYY-MM-DD) ke tampilan
    const d = new Date(dateVal + "T00:00:00");
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }
  if (dateVal?.toDate) {
    return dateVal.toDate().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
  }
  return "-";
};

// ─────────────────────────────────────────────
// MODAL: CREATE / EDIT TASK
// ─────────────────────────────────────────────
const TaskModal = ({ task, onClose, onSave }) => {
  const [form, setForm] = useState({
    taskName: task?.taskName  || "",
    client:   task?.client    || "",
    pic:      task?.pic       || TEAM_MEMBERS[0].name,
    category: task?.category  || CATEGORIES[0],
    deadline: task?.deadline  || "",
    status:   task?.status    || "Pending",
    notes:    task?.notes     || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.taskName.trim()) return setError("Nama task wajib diisi.");
    if (!form.deadline)        return setError("Deadline wajib diisi.");
    setSaving(true);
    setError("");
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan. Coba lagi.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h3 className="font-bold text-lg text-[#0B1F33]">
            {task ? "Edit Task" : "Buat Task Baru"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2 rounded-lg">
              {error}
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nama Task *</label>
            <input
              name="taskName"
              value={form.taskName}
              onChange={handleChange}
              placeholder="Contoh: BPOM Product Registration"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B]"
            />
          </div>

          {/* Client */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Client</label>
            <input
              name="client"
              value={form.client}
              onChange={handleChange}
              placeholder="Contoh: PT Maju Bersama"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B]"
            />
          </div>

          {/* PIC + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">PIC</label>
              <select
                name="pic"
                value={form.pic}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B] bg-white"
              >
                {TEAM_MEMBERS.map((m) => (
                  <option key={m.name} value={m.name}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Kategori</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B] bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Deadline + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Deadline *</label>
              <input
                type="date"
                name="deadline"
                value={form.deadline}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Status</label>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B] bg-white"
              >
                {Object.keys(STATUS_CONFIG).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Catatan (opsional)</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              placeholder="Tambahkan detail atau instruksi..."
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-[#17415B] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-lg border border-gray-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 text-sm bg-[#0B1F33] text-white rounded-lg font-semibold hover:bg-[#17415B] disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : task ? "Simpan Perubahan" : "Buat Task"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// CONFIRM DELETE MODAL
// ─────────────────────────────────────────────
const DeleteModal = ({ taskName, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
      <div className="text-5xl mb-4">🗑️</div>
      <h3 className="font-bold text-lg text-[#0B1F33] mb-2">Hapus Task?</h3>
      <p className="text-sm text-gray-500 mb-6">
        Task <strong>"{taskName}"</strong> akan dihapus permanen dan tidak bisa dikembalikan.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Batal
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-2.5 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 disabled:opacity-50"
        >
          {loading ? "Menghapus..." : "Hapus"}
        </button>
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────
// KOMPONEN UTAMA TODO
// ─────────────────────────────────────────────
const Todo = () => {
  const { user, logout, getUserDisplayName } = useAuth();

  // ── State ──────────────────────────────────
  const [tasks, setTasks]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterPIC, setFilterPIC]       = useState("All Tasks");
  const [showModal, setShowModal]       = useState(false);
  const [editTask, setEditTask]         = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeNav, setActiveNav]       = useState("Dashboard");

  const displayName = getUserDisplayName(user?.email);
  const userInitial = displayName.charAt(0).toUpperCase();

  // ── Realtime listener Firestore ────────────
  useEffect(() => {
    const q = query(collection(db, "tasks"), orderBy("createdAt", "desc"));

    // onSnapshot = realtime — semua user langsung lihat update
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setTasks(taskList);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    // Cleanup saat unmount
    return () => unsubscribe();
  }, []);

  // ── Statistik otomatis dari data real ──────
  const stats = {
    total:      tasks.length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    completed:  tasks.filter((t) => t.status === "Completed").length,
    overdue:    tasks.filter((t) => t.status === "Overdue").length,
  };

  // ── Filter tasks berdasarkan PIC ────────────
  const filteredTasks = filterPIC === "All Tasks"
    ? tasks
    : tasks.filter((t) => t.pic === filterPIC || getMemberShort(t.pic) === filterPIC);

  // ── Task count per member ───────────────────
  const getMemberTaskCount = (memberName) =>
    tasks.filter((t) => t.pic === memberName).length;

  // ── Notifikasi helper ──────────────────────
  const showNotif = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // ── CREATE task ───────────────────────────
  const handleCreateTask = async (formData) => {
    await addDoc(collection(db, "tasks"), {
      ...formData,
      createdAt:    serverTimestamp(),
      updatedAt:    serverTimestamp(),
      createdBy:    user.email,
      createdByName: displayName,
    });
    showNotif("success", "Task berhasil dibuat!");
  };

  // ── UPDATE task ───────────────────────────
  const handleUpdateTask = async (formData) => {
    const taskRef = doc(db, "tasks", editTask.id);
    await updateDoc(taskRef, {
      ...formData,
      updatedAt:     serverTimestamp(),
      updatedBy:     user.email,
      updatedByName: displayName,
    });
    setEditTask(null);
    showNotif("success", "Task berhasil diupdate!");
  };

  // ── UPDATE status saja (dari dropdown di tabel) ──
  const handleStatusChange = async (taskId, newStatus) => {
    await updateDoc(doc(db, "tasks", taskId), {
      status:    newStatus,
      updatedAt: serverTimestamp(),
    });
    showNotif("success", `Status diubah ke "${newStatus}"`);
  };

  // ── DELETE task ───────────────────────────
  const handleDeleteTask = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(db, "tasks", deleteTarget.id));
      showNotif("success", "Task berhasil dihapus.");
    } catch (err) {
      console.error(err);
      showNotif("error", "Gagal menghapus task.");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F3F6F8] flex font-sans text-[#172B3A]">

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside className="hidden lg:flex w-64 bg-[#0B1F33] text-white flex-col px-6 py-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-11 h-11 bg-[#C5A46D] rounded-xl flex items-center justify-center text-2xl">⚓</div>
          <div>
            <h1 className="text-xl font-bold tracking-widest">LEGALITA</h1>
            <p className="text-[10px] text-blue-200 tracking-[3px]">CORPORATE WORKSPACE</p>
          </div>
        </div>

        <p className="text-xs text-blue-300 font-semibold mb-4 tracking-widest">WORKSPACE</p>

        {/* Nav */}
        <nav className="space-y-2">
          {[
            ["▦", "Dashboard"],
            ["☑", "My Tasks"],
            ["♙", "Team Management"],
            ["▤", "Client Management"],
            ["⚖", "Regulatory"],
            ["▧", "Reports"],
          ].map(([icon, label]) => (
            <div
              key={label}
              onClick={() => setActiveNav(label)}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                activeNav === label
                  ? "bg-[#17415B] text-[#E2C28A]"
                  : "text-blue-100 hover:bg-[#17364E]"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </nav>

        {/* Bottom: user info + logout */}
        <div className="mt-auto">
          <div className="border border-[#29445A] rounded-2xl p-4 bg-[#112B40]">
            <p className="text-xs text-blue-200">LEGALITA EXIM</p>
            <h3 className="font-semibold mt-2">Global Trade Solutions</h3>
            <p className="text-xs text-blue-300 mt-2">Licensing · Compliance · Shipment</p>
          </div>

          {/* User info + tombol logout */}
          <div className="mt-4 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="w-8 h-8 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#C5A46D] flex items-center justify-center text-sm font-bold text-[#0B1F33] flex-shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white leading-tight truncate">{displayName}</p>
                <p className="text-[10px] text-blue-300 leading-tight truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              title="Keluar"
              className="text-blue-400 hover:text-red-400 text-xl transition-colors flex-shrink-0"
            >
              ⏻
            </button>
          </div>

          <p className="text-center text-xs text-blue-400 mt-4">© 2026 LEGALITA</p>
        </div>
      </aside>


      {/* ═══════════ MAIN ═══════════ */}
      <main className="flex-1 min-w-0">

        {/* TOPBAR */}
        <header className="bg-white border-b border-gray-200 px-5 md:px-10 py-5 flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-400">Workspace / {activeNav}</p>
            <h2 className="text-xl font-bold mt-1">{activeNav}</h2>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden sm:block text-sm border border-gray-200 px-4 py-2 rounded-lg">
              {new Date().toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
            </button>

            {/* Avatar user yang sedang login */}
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-10 h-10 rounded-full border-2 border-[#C5A46D]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#0B1F33] text-white flex items-center justify-center font-bold">
                  {userInitial}
                </div>
              )}
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-[#0B1F33] leading-tight">{displayName}</p>
                <p className="text-xs text-gray-400 leading-tight">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>


        {/* CONTENT */}
        <div className="p-5 md:p-10 max-w-[1600px] mx-auto">

          {/* NOTIFIKASI TOAST */}
          {notification && (
            <div className={`fixed top-5 right-5 z-40 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${
              notification.type === "success"
                ? "bg-emerald-500 text-white"
                : "bg-red-500 text-white"
            }`}>
              {notification.type === "success" ? "✓ " : "✕ "}
              {notification.message}
            </div>
          )}


          {/* WELCOME SECTION */}
          <section className="relative overflow-hidden bg-[#0B1F33] rounded-2xl p-7 md:p-10 text-white mb-8">
            <div className="relative z-10 max-w-xl">
              <p className="text-[#C5A46D] text-xs font-semibold tracking-[3px] uppercase">
                Maritime Business Operations
              </p>
              <h1 className="text-3xl md:text-4xl font-bold mt-4 leading-tight">
                Selamat datang, {displayName.split(" ")[0]}! 👋
              </h1>
              <p className="text-blue-200 text-sm mt-4 leading-relaxed">
                Kelola aktivitas tim, pantau progress klien, dan awasi operasi
                regulasi dalam satu workspace terpusat.
              </p>
              <button
                onClick={() => { setEditTask(null); setShowModal(true); }}
                className="mt-6 bg-[#C5A46D] text-[#0B1F33] font-semibold text-sm px-6 py-3 rounded-lg hover:bg-[#D8BB89]"
              >
                + Buat Task Baru →
              </button>
            </div>
            {/* Decorative */}
            <div className="absolute right-[-30px] bottom-[-100px] w-80 h-80 border border-[#45647B] rounded-full opacity-30" />
            <div className="absolute right-[-5px] bottom-[-75px] w-64 h-64 border border-[#C5A46D] rounded-full opacity-30" />
            <div className="absolute right-12 bottom-[-50px] w-48 h-48 border border-[#45647B] rounded-full opacity-30" />
            <div className="absolute right-16 top-8 text-[#C5A46D] text-8xl opacity-20 hidden md:block">⚓</div>
          </section>


          {/* STATISTIK — data real dari Firestore */}
          <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
            {[
              { title: "Total Tasks",  value: stats.total,      sub: "Semua task",        icon: "▦", color: "text-blue-700",    bg: "bg-blue-50" },
              { title: "In Progress",  value: stats.inProgress, sub: "Sedang dikerjakan", icon: "◷", color: "text-amber-600",   bg: "bg-amber-50" },
              { title: "Completed",    value: stats.completed,  sub: "Selesai",           icon: "✓", color: "text-emerald-600", bg: "bg-emerald-50" },
              { title: "Overdue",      value: stats.overdue,    sub: "Perlu perhatian",   icon: "!", color: "text-red-600",     bg: "bg-red-50" },
            ].map((item) => (
              <div key={item.title} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">{item.title}</p>
                  <div className={`${item.bg} ${item.color} w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg`}>
                    {item.icon}
                  </div>
                </div>
                <h2 className="text-3xl font-bold mt-5">
                  {loading ? "..." : String(item.value).padStart(2, "0")}
                </h2>
                <p className="text-xs text-gray-400 mt-2">{item.sub}</p>
              </div>
            ))}
          </section>


          {/* TEAM OVERVIEW — task count real */}
          <section className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-xl font-bold">Team Overview</h2>
                <p className="text-sm text-gray-400 mt-1">Monitor workload harian tim</p>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {TEAM_MEMBERS.map((member) => (
                <div key={member.name} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${member.color}`}>
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{member.role}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 mt-5 pt-4 flex justify-between">
                    <span className="text-sm text-gray-500">Assigned Tasks</span>
                    <span className="font-bold text-[#17415B]">
                      {loading ? "..." : String(getMemberTaskCount(member.name)).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>


          {/* TASK MANAGEMENT */}
          <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-bold">Task Management</h2>
                <p className="text-sm text-gray-400 mt-1">Track dan kelola operasi harian</p>
              </div>
              <button
                onClick={() => { setEditTask(null); setShowModal(true); }}
                className="bg-[#0B1F33] text-white px-5 py-3 rounded-lg text-sm font-semibold hover:bg-[#17415B]"
              >
                + Create Task
              </button>
            </div>

            {/* Filter PIC */}
            <div className="px-6 py-4 flex flex-wrap gap-3 border-b border-gray-100">
              {["All Tasks", ...TEAM_MEMBERS.map((m) => getMemberShort(m.name))].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilterPIC(item)}
                  className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                    filterPIC === item
                      ? "bg-[#0B1F33] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {item}
                  {item !== "All Tasks" && !loading && (
                    <span className="ml-1.5 text-xs opacity-60">
                      ({getMemberTaskCount(TEAM_MEMBERS.find(m => getMemberShort(m.name) === item)?.name ?? "")})
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Task Table */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-10 text-center text-gray-400">
                  <p className="text-2xl mb-2">⏳</p>
                  <p className="text-sm">Memuat tasks dari database...</p>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="p-10 text-center text-gray-400">
                  <p className="text-4xl mb-3">📋</p>
                  <p className="text-sm font-medium">Belum ada task</p>
                  <p className="text-xs mt-1">Klik "+ Create Task" untuk menambahkan task pertama</p>
                </div>
              ) : (
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-400">
                    <tr>
                      <th className="px-6 py-4">Task Name</th>
                      <th className="px-6 py-4">PIC</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Deadline</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTasks.map((task) => {
                      const memberInfo = getMemberInfo(task.pic);
                      return (
                        <tr key={task.id} className="hover:bg-gray-50">

                          {/* Task Name */}
                          <td className="px-6 py-5">
                            <p className="font-semibold text-sm">{task.taskName}</p>
                            {task.client && (
                              <p className="text-xs text-gray-400 mt-1">{task.client}</p>
                            )}
                            {task.notes && (
                              <p className="text-xs text-blue-400 mt-1 italic truncate max-w-[200px]" title={task.notes}>
                                📝 {task.notes}
                              </p>
                            )}
                          </td>

                          {/* PIC */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${memberInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                                {memberInfo?.initials ?? task.pic?.charAt(0)}
                              </div>
                              <span className="text-sm">{getMemberShort(task.pic)}</span>
                            </div>
                          </td>

                          {/* Category */}
                          <td className="px-6 py-5">
                            <span className="text-xs bg-blue-50 text-blue-800 px-3 py-1.5 rounded-full">
                              {task.category}
                            </span>
                          </td>

                          {/* Deadline */}
                          <td className="px-6 py-5 text-sm text-gray-500">
                            {formatDate(task.deadline)}
                          </td>

                          {/* Status — bisa diubah langsung via dropdown */}
                          <td className="px-6 py-5">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task.id, e.target.value)}
                              className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer focus:outline-none border-0 ${
                                STATUS_CONFIG[task.status]?.color ?? "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {Object.keys(STATUS_CONFIG).map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </td>

                          {/* Aksi */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => { setEditTask(task); setShowModal(true); }}
                                className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setDeleteTarget(task)}
                                className="text-xs px-3 py-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Table footer */}
            <div className="px-6 py-4 border-t border-gray-100 text-xs text-gray-400">
              Menampilkan {filteredTasks.length} dari {tasks.length} total task
              {filterPIC !== "All Tasks" && ` · Filter: ${filterPIC}`}
            </div>
          </section>


          {/* PAGE FOOTER */}
          <footer className="mt-8 flex flex-wrap justify-between gap-3 text-xs text-gray-400">
            <p>LEGALITA © 2026. All rights reserved.</p>
            <p>Navigate Compliance. Empower Business.</p>
          </footer>

        </div>
      </main>


      {/* ═══════════ MODALS ═══════════ */}

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => { setShowModal(false); setEditTask(null); }}
          onSave={editTask ? handleUpdateTask : handleCreateTask}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          taskName={deleteTarget.taskName}
          onConfirm={handleDeleteTask}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}

    </div>
  );
};

export default Todo;
```

---

## 9. Firestore Data Structure

Setiap dokumen di collection `tasks`:

```json
{
  "id": "auto-generated-firestore-id",
  "taskName":      "BPOM Product Registration",
  "client":        "PT Maju Bersama",
  "pic":           "Aji Pangestu",
  "category":      "Regulatory",
  "deadline":      "2026-11-22",
  "status":        "In Progress",
  "notes":         "Prioritas tinggi",
  "createdAt":     "Firebase Timestamp",
  "updatedAt":     "Firebase Timestamp",
  "createdBy":     "aji@gmail.com",
  "createdByName": "Aji Pangestu"
}
```

---

## 10. Rules Firestore (Security)

Setelah selesai development, buka **Firestore → Rules** dan ganti dengan:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isAllowedUser() {
      return request.auth != null && request.auth.token.email in [
        'aji@gmail.com',    // ← ganti email asli
        'nabil@gmail.com',  // ← ganti email asli
        'rocki@gmail.com'   // ← ganti email asli
      ];
    }
    
    match /tasks/{taskId} {
      allow read, write: if isAllowedUser();
    }
    
  }
}
```

---

## 11. Environment Variables (.env)

Buat file `.env` di `TodoApp/TodoApp/.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=legalita-todo.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=legalita-todo
VITE_FIREBASE_STORAGE_BUCKET=legalita-todo.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

> **⚠️ PENTING**:
> - Isi nilai-nilai ini dari **Firebase Project Settings → Your apps**  
> - Prefix `VITE_` wajib ada agar Vite bisa baca env variable  
> - Jangan commit `.env` ke Git! Tambahkan ke `.gitignore`

Tambahkan ke `.gitignore`:
```
.env
.env.local
```

---

## 12. Alur Kerja Lengkap

```
Step 1: npm install firebase
Step 2: Setup Firebase project (Auth Google + Firestore)
Step 3: Copy firebaseConfig ke .env
Step 4: Buat src/firebase.js
Step 5: Buat src/context/AuthContext.jsx (isi ALLOWED_EMAILS!)
Step 6: Buat src/Components/Login.jsx
Step 7: Replace src/App.jsx
Step 8: Replace src/Components/Todo.jsx
Step 9: npm run dev
Step 10: Test login dengan akun Google yang ada di whitelist
```

### ✅ Checklist sebelum testing

- [ ] `.env` sudah diisi config Firebase yang benar
- [ ] `ALLOWED_EMAILS` di `AuthContext.jsx` sudah diisi email asli 3 user
- [ ] Firebase Auth → Google Sign-in sudah di-enable
- [ ] Firestore sudah dibuat (minimal test mode)
- [ ] `firebase` package sudah terinstall

---

## 🔧 Troubleshooting

| Problem | Solusi |
|--------|--------|
| `auth/popup-blocked` | Izinkan popup di browser settings untuk localhost |
| `permission-denied` di Firestore | Cek rules, pastikan test mode atau rules sudah benar |
| User login tapi kena "Access Denied" | Cek email di `ALLOWED_EMAILS` — harus persis sama. Lihat email asli di Firebase → Authentication → Users |
| `.env` tidak terbaca | Pastikan prefix `VITE_` dan restart dev server |
| `Module not found: firebase` | Jalankan `npm install firebase` |
| Statistik selalu "00" | Pastikan Firestore listener aktif dan rules mengizinkan read |

---

> 💡 **Tips Email Whitelist**: Suruh Aji, Nabil, Rocki coba login sekali pakai akun Google mereka.  
> Setelah itu cek **Firebase Console → Authentication → Users** untuk melihat email exat yang mereka pakai.  
> Copy email tersebut ke array `ALLOWED_EMAILS` di `AuthContext.jsx`.
