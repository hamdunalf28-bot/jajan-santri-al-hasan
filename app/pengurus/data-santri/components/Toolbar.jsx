"use client";

export default function Toolbar({ onTambah, onPengaturan, onRefresh }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 mb-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onTambah}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          ➕ Tambah Santri
        </button>

        <button
          type="button"
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          🔄 Refresh
        </button>

        <button
          type="button"
          onClick={onPengaturan}
          className="bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-xl font-semibold transition"
        >
          ⚙ Pengaturan
        </button>
      </div>
    </div>
  );
}