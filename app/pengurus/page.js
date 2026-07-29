"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function PengurusPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [totalTopupHariIni, setTotalTopupHariIni] = useState(0);
  const [totalJajanHariIni, setTotalJajanHariIni] = useState(0);

  const tanggalHariIni = useMemo(() => {
    return new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "pengurus") {
      router.push("/");
      return;
    }
    setUser(u);
  }, [router]);

  const loadSummary = async () => {
    setLoadingSummary(true);

    try {
      const { data: santriData, error: errSantri } = await supabase
        .from("santri")
        .select("saldo");

      if (errSantri) throw errSantri;

      const sumSaldo = (santriData || []).reduce(
        (acc, s) => acc + Number(s.saldo || 0),
        0
      );
      setTotalSaldo(sumSaldo);

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const { data: trxData, error: errTrx } = await supabase
        .from("transaksi")
        .select("jenis,jumlah,created_at")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString());

      if (errTrx) throw errTrx;

      let topup = 0;
      let jajan = 0;

      for (const t of trxData || []) {
        if (t.jenis === "topup") topup += Number(t.jumlah || 0);
        if (t.jenis === "jajan") jajan += Number(t.jumlah || 0);
      }

      setTotalTopupHariIni(topup);
      setTotalJajanHariIni(jajan);
    } catch (e) {
      console.error(e);
      alert("Gagal memuat ringkasan: " + (e?.message || "unknown error"));
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (user?.role === "pengurus") loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]);

  const menus = [
    { label: "Data Santri", icon: "👨‍🎓", href: "/pengurus/data-santri" },
    { label: "Top Up Saldo", icon: "💰", href: "/pengurus/topup" },
    { label: "Transaksi Jajan", icon: "🛒", href: "/pengurus/jajan" },
    { label: "Laporan", icon: "📊", href: "/pengurus/laporan" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Logo"
              width={50}
              height={50}
              style={{ width: "auto", height: "auto" }}
            />
            <div>
              <h1 className="text-white font-bold text-lg">
                Pondok Pesantren Al-Hasan Thousand
              </h1>
              <p className="text-emerald-100 text-sm">Sistem Jajan Santri</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Welcome */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <p className="text-gray-500 text-sm">Selamat datang,</p>
          <h2 className="text-2xl font-bold text-emerald-700">
            {user?.nama || "Pengurus"}
          </h2>
          <p className="text-xs text-gray-400">ID: {user?.kode_id}</p>
        </div>

        {/* Ringkasan */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-extrabold text-gray-900">
                Ringkasan Keuangan
              </h3>
              <p className="text-sm text-gray-500">
                Update: {tanggalHariIni} {loadingSummary ? "(memuat...)" : ""}
              </p>
            </div>

            <button
              onClick={loadSummary}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Refresh Ringkasan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-emerald-50 p-5">
              <div className="text-sm font-semibold text-emerald-900">
                Total Saldo (Semua Santri)
              </div>
              <div className="text-2xl font-extrabold text-emerald-900 mt-2">
                Rp {Number(totalSaldo).toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-emerald-900/70 mt-2">
                Per {tanggalHariIni}
              </div>
            </div>

            <div className="rounded-2xl border bg-sky-50 p-5">
              <div className="text-sm font-semibold text-sky-900">
                Total Top Up (Hari Ini)
              </div>
              <div className="text-2xl font-extrabold text-sky-900 mt-2">
                Rp {Number(totalTopupHariIni).toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-sky-900/70 mt-2">
                Tanggal {tanggalHariIni}
              </div>
            </div>

            <div className="rounded-2xl border bg-rose-50 p-5">
              <div className="text-sm font-semibold text-rose-900">
                Total Pengeluaran (Hari Ini)
              </div>
              <div className="text-2xl font-extrabold text-rose-900 mt-2">
                Rp {Number(totalJajanHariIni).toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-rose-900/70 mt-2">
                Tanggal {tanggalHariIni}
              </div>
            </div>
          </div>
        </div>

        {/* Menu */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {menus.map((m) => (
            <button
              key={m.href}
              type="button"
              onClick={() => router.push(m.href)}
              className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center hover:shadow-2xl hover:-translate-y-1 transition"
            >
              <div className="text-4xl mb-2">{m.icon}</div>
              <p className="font-semibold text-emerald-700 text-center">
                {m.label}
              </p>
            </button>
          ))}
        </div>

        <p className="text-center text-emerald-100 text-xs mt-10">
          © 2026 Pondok Pesantren Al-Hasan Thousand
        </p>
      </div>
    </div>
  );
}