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
    { name: "Aji Pangestu", initials: "A", role: "Client Relations & IT", color: "bg-blue-100 text-blue-800" },
    { name: "Nabil", initials: "N", role: "Technical Operations", color: "bg-amber-100 text-amber-800" },
    { name: "Rocki", initials: "R", role: "Technical & Supervisor", color: "bg-emerald-100 text-emerald-800" },
];

const CATEGORIES = ["Regulatory", "Technical", "EXIM", "Administration", "Legal"];

const STATUS_CONFIG = {
    "Pending": { color: "bg-gray-100 text-gray-600" },
    "In Progress": { color: "bg-amber-100 text-amber-700" },
    "Completed": { color: "bg-emerald-100 text-emerald-700" },
    "Overdue": { color: "bg-red-100 text-red-700" },
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
        taskName: task?.taskName || "",
        client: task?.client || "",
        pic: task?.pic || TEAM_MEMBERS[0].name,
        category: task?.category || CATEGORIES[0],
        deadline: task?.deadline || "",
        status: task?.status || "Pending",
        notes: task?.notes || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.taskName.trim()) return setError("Nama task wajib diisi.");
        if (!form.deadline) return setError("Deadline wajib diisi.");
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
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterPIC, setFilterPIC] = useState("All Tasks");
    const [showModal, setShowModal] = useState(false);
    const [editTask, setEditTask] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [notification, setNotification] = useState(null);
    const [activeNav, setActiveNav] = useState("Dashboard");

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
        total: tasks.length,
        inProgress: tasks.filter((t) => t.status === "In Progress").length,
        completed: tasks.filter((t) => t.status === "Completed").length,
        overdue: tasks.filter((t) => t.status === "Overdue").length,
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
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: user.email,
            createdByName: displayName,
        });
        showNotif("success", "Task berhasil dibuat!");
    };

    // ── UPDATE task ───────────────────────────
    const handleUpdateTask = async (formData) => {
        const taskRef = doc(db, "tasks", editTask.id);
        await updateDoc(taskRef, {
            ...formData,
            updatedAt: serverTimestamp(),
            updatedBy: user.email,
            updatedByName: displayName,
        });
        setEditTask(null);
        showNotif("success", "Task berhasil diupdate!");
    };

    // ── UPDATE status saja (dari dropdown di tabel) ──
    const handleStatusChange = async (taskId, newStatus) => {
        await updateDoc(doc(db, "tasks", taskId), {
            status: newStatus,
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
                            className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-colors ${activeNav === label
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
                        <div className={`fixed top-5 right-5 z-40 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${notification.type === "success"
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
                            { title: "Total Tasks", value: stats.total, sub: "Semua task", icon: "▦", color: "text-blue-700", bg: "bg-blue-50" },
                            { title: "In Progress", value: stats.inProgress, sub: "Sedang dikerjakan", icon: "◷", color: "text-amber-600", bg: "bg-amber-50" },
                            { title: "Completed", value: stats.completed, sub: "Selesai", icon: "✓", color: "text-emerald-600", bg: "bg-emerald-50" },
                            { title: "Overdue", value: stats.overdue, sub: "Perlu perhatian", icon: "!", color: "text-red-600", bg: "bg-red-50" },
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
                                    className={`px-4 py-2 text-sm rounded-lg transition-colors ${filterPIC === item
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
                                                            className={`text-xs px-3 py-1.5 rounded-full font-medium cursor-pointer focus:outline-none border-0 ${STATUS_CONFIG[task.status]?.color ?? "bg-gray-100 text-gray-600"
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