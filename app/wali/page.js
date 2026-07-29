"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function PengurusPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "pengurus") {
      router.push("/");
      return;
    }
    setUser(u);
  }, []);

  const menus = [
    { label: "Data Santri", icon: "👨‍🎓", href: "/pengurus/data-santri" },
    { label: "Top Up Saldo", icon: "💰", href: "/pengurus/topup" },
    { label: "Transaksi Jajan", icon: "🛒", href: "/pengurus/jajan" },
    { label: "Laporan", icon: "📊", href: "/pengurus/laporan" },
    { label: "Pengaturan", icon: "⚙️", href: "/pengurus/pengaturan" }, // ✅ MENU BARU
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 p-6">
      <div className="max-w-4xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={50} height={50} />
            <div>
              <h1 className="text-white font-bold text-lg">
                Pondok Pesantren Al-Hasan
              </h1>
              <p className="text-emerald-100 text-sm">
                Sistem Jajan Santri
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600"
          >
            Logout
          </button>
        </div>

        {/* WELCOME CARD */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <p className="text-gray-500 text-sm">Selamat datang,</p>
          <h2 className="text-2xl font-bold text-emerald-700">
            {user?.nama}
          </h2>
          <p className="text-xs text-gray-400">
            ID: {user?.kode_id}
          </p>
        </div>

        {/* MENU GRID */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {menus.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl hover:-translate-y-1 transition"
            >
              <div className="text-4xl mb-2">{m.icon}</div>
              <p className="font-semibold text-emerald-700 text-center">
                {m.label}
              </p>
            </Link>
          ))}
        </div>

        {/* FOOTER */}
        <p className="text-center text-emerald-100 text-xs mt-10">
          © 2026 Pondok Pesantren Al-Hasan
        </p>
      </div>
    </div>
  );
}