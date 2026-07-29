"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Image from "next/image";

export default function WaliPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [santri, setSantri] = useState(null);
  const [trx, setTrx] = useState([]);

  const [loading, setLoading] = useState(false);

  // filter cepat (hari)
  const [quickDays, setQuickDays] = useState(7); // default 7 hari

  // filter kalender
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const d7 = new Date();
  d7.setDate(d7.getDate() - 7);
  const defaultFrom = d7.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  // ====== guard + load santri ======
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "wali") {
      router.push("/");
      return;
    }
    setUser(u);

    const loadSantri = async () => {
      const { data, error } = await supabase
        .from("santri")
        .select("*")
        .eq("wali_kode", u.kode_id)
        .single();

      if (error || !data) {
        console.error(error);
        alert("Data santri untuk wali ini tidak ditemukan.");
        return;
      }

      setSantri(data);
    };

    loadSantri();
  }, [router]);

  const loadTrxByDateRange = async (kodeSantri) => {
    setLoading(true);

    const fromISO = new Date(`${fromDate}T00:00:00`).toISOString();
    const toISO = new Date(`${toDate}T23:59:59.999`).toISOString();

    const { data, error } = await supabase
      .from("transaksi")
      .select("*")
      .eq("kode_santri", kodeSantri)
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Gagal mengambil transaksi: " + error.message);
      return;
    }

    setTrx(data || []);
  };

  const setQuickFilter = (days) => {
    setQuickDays(days);
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    setToDate(to.toISOString().slice(0, 10));
    setFromDate(from.toISOString().slice(0, 10));
  };

  // load transaksi saat santri sudah ada atau tanggal berubah
  useEffect(() => {
    if (!santri?.kode_id) return;
    loadTrxByDateRange(santri.kode_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [santri?.kode_id, fromDate, toDate]);

  const summary = useMemo(() => {
    let totalTopup = 0;
    let totalJajan = 0;

    for (const t of trx) {
      if (t.jenis === "topup") totalTopup += Number(t.jumlah || 0);
      if (t.jenis === "jajan") totalJajan += Number(t.jumlah || 0);
    }

    return { count: trx.length, totalTopup, totalJajan };
  }, [trx]);

  const exportExcel = () => {
    if (!santri) return;

    const rows = trx.map((t) => ({
      tanggal: new Date(t.created_at).toLocaleString("id-ID"),
      jenis: t.jenis,
      nominal: Number(t.jumlah || 0),
      saldo_setelah: Number(t.saldo_setelah || 0),
      keterangan: t.keterangan || "",
      oleh: t.created_by || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Riwayat");
    XLSX.writeFile(wb, `riwayat_${santri.kode_id}_${fromDate}_sd_${toDate}.xlsx`);
  };

  const exportPDF = () => {
    if (!santri) return;

    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("Riwayat Transaksi Jajan Santri", 14, 14);

    doc.setFontSize(10);
    doc.text(`Pesantren: Pondok Pesantren Al-Hasan Thousand`, 14, 20);
    doc.text(`Santri: ${santri.nama} (${santri.kode_id})`, 14, 25);
    doc.text(`Periode: ${fromDate} s/d ${toDate}`, 14, 30);

    autoTable(doc, {
      startY: 36,
      head: [["Tanggal", "Jenis", "Nominal", "Saldo Setelah", "Keterangan", "Oleh"]],
      body: trx.map((t) => [
        new Date(t.created_at).toLocaleString("id-ID"),
        t.jenis === "topup" ? "Top Up" : "Jajan",
        `Rp ${Number(t.jumlah || 0).toLocaleString("id-ID")}`,
        `Rp ${Number(t.saldo_setelah || 0).toLocaleString("id-ID")}`,
        t.keterangan || "-",
        t.created_by || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [4, 120, 87] },
    });

    doc.save(`riwayat_${santri.kode_id}_${fromDate}_sd_${toDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* header like bank */}
      <div className="bg-gradient-to-r from-emerald-700 to-emerald-900">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Logo"
                width={30}
                height={30}
                style={{ width: "auto", height: "auto" }}
                priority
              />
            </div>
            <div>
              <div className="text-white font-bold leading-tight">Akun Wali Santri</div>
              <div className="text-emerald-100 text-sm">
                Pondok Pesantren Al-Hasan Thousand
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }}
            className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl border border-white/20"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
        {/* saldo card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white rounded-3xl shadow-lg border p-6">
            <div className="text-sm text-gray-500">Saldo Jajan</div>
            <div className="text-4xl font-extrabold text-emerald-800 mt-2">
              Rp {Number(santri?.saldo || 0).toLocaleString("id-ID")}
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-2xl bg-emerald-50 border p-4">
                <div className="text-gray-500 text-xs">Santri</div>
                <div className="font-bold text-gray-900">{santri?.nama || "-"}</div>
                <div className="text-xs text-gray-500">{santri?.kode_id || "-"}</div>
              </div>
              <div className="rounded-2xl bg-sky-50 border p-4">
                <div className="text-gray-500 text-xs">Wali</div>
                <div className="font-bold text-gray-900">{user?.nama || "-"}</div>
                <div className="text-xs text-gray-500">{user?.kode_id || "-"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border p-6">
            <div className="text-sm font-bold text-gray-900">Ringkasan Periode</div>
            <div className="text-xs text-gray-500 mt-1">
              {fromDate} s/d {toDate}
            </div>

            <div className="text-sm text-gray-600 mt-3">
              Total transaksi: <b>{summary.count}</b>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Total top up: <b>Rp {summary.totalTopup.toLocaleString("id-ID")}</b>
            </div>
            <div className="text-sm text-gray-600 mt-2">
              Total jajan: <b>Rp {summary.totalJajan.toLocaleString("id-ID")}</b>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
              >
                Print
              </button>
              <button
                onClick={exportExcel}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
              >
                Excel
              </button>
              <button
                onClick={exportPDF}
                className="col-span-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl text-sm font-semibold"
              >
                PDF
              </button>
            </div>
          </div>
        </div>

        {/* filter */}
        <div className="bg-white rounded-3xl shadow-lg border p-6">
          <div className="font-bold text-gray-900 mb-4">Filter Riwayat</div>

          <div className="flex flex-wrap gap-2 mb-4">
            {[3, 7, 10].map((d) => (
              <button
                key={d}
                onClick={() => setQuickFilter(d)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                  quickDays === d
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                {d} Hari
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Dari</div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setQuickDays(0);
                  setFromDate(e.target.value);
                }}
                className="w-full border rounded-2xl p-3"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-700 mb-1">Sampai</div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setQuickDays(0);
                  setToDate(e.target.value);
                }}
                className="w-full border rounded-2xl p-3"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => santri?.kode_id && loadTrxByDateRange(santri.kode_id)}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-3 rounded-2xl font-semibold"
              >
                Tampilkan
              </button>
            </div>
          </div>

          {loading && <div className="text-sm text-gray-500 mt-3">Memuat data...</div>}
        </div>

        {/* table */}
        <div className="bg-white rounded-3xl shadow-lg border overflow-hidden">
          <div className="p-6 border-b">
            <div className="font-bold text-gray-900">Riwayat Transaksi</div>
            <div className="text-sm text-gray-500 mt-1">
              Periode: {fromDate} s/d {toDate}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-800 text-white">
                <tr>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Jenis</th>
                  <th className="p-3 text-right">Nominal</th>
                  <th className="p-3 text-right">Saldo Setelah</th>
                  <th className="p-3 text-left">Keterangan</th>
                  <th className="p-3 text-left">Oleh</th>
                </tr>
              </thead>
              <tbody>
                {trx.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">{new Date(t.created_at).toLocaleString("id-ID")}</td>
                    <td className="p-3">{t.jenis === "topup" ? "Top Up" : "Jajan"}</td>
                    <td className="p-3 text-right">
                      Rp {Number(t.jumlah || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3 text-right">
                      Rp {Number(t.saldo_setelah || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">{t.keterangan || "-"}</td>
                    <td className="p-3">{t.created_by || "-"}</td>
                  </tr>
                ))}

                {trx.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-10 text-center text-gray-400">
                      Tidak ada transaksi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-400">© 2026 Pondok Pesantren Al-Hasan Thousand</p>
      </div>
    </div>
  );
}