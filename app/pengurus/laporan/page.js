"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function LaporanPage() {
  const router = useRouter();

  const [santriList, setSantriList] = useState([]);
  const [trx, setTrx] = useState([]);

  // filter tanggal (default: 7 hari terakhir)
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const d7 = new Date();
  d7.setDate(d7.getDate() - 7);
  const defaultFrom = d7.toISOString().slice(0, 10);

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  // filter santri (optional)
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [kodeSantriFilter, setKodeSantriFilter] = useState(""); // kosong = semua santri

  const [loading, setLoading] = useState(false);

  // ====== guard pengurus ======
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "pengurus") router.push("/");
  }, [router]);

  const loadSantri = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("kode_id,nama")
      .order("nama", { ascending: true });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data santri: " + error.message);
      return;
    }

    setSantriList(data || []);
  };

  const loadTransaksi = async () => {
    setLoading(true);

    // from start day
    const fromISO = new Date(`${fromDate}T00:00:00`).toISOString();
    // to end day
    const toISO = new Date(`${toDate}T23:59:59.999`).toISOString();

    let q = supabase
      .from("transaksi")
      .select("*")
      .gte("created_at", fromISO)
      .lte("created_at", toISO)
      .order("created_at", { ascending: false });

    if (kodeSantriFilter) {
      q = q.eq("kode_santri", kodeSantriFilter);
    }

    const { data, error } = await q;

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Gagal mengambil transaksi: " + error.message);
      return;
    }

    setTrx(data || []);
  };

  useEffect(() => {
    loadSantri();
    loadTransaksi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // suggestions santri
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return santriList
      .filter(
        (s) =>
          (s.nama || "").toLowerCase().includes(q) ||
          (s.kode_id || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [santriList, search]);

  const santriMap = useMemo(() => {
    const m = {};
    for (const s of santriList) m[s.kode_id] = s.nama;
    return m;
  }, [santriList]);

  const summary = useMemo(() => {
    let totalTopup = 0;
    let totalJajan = 0;

    for (const t of trx) {
      if (t.jenis === "topup") totalTopup += Number(t.jumlah || 0);
      if (t.jenis === "jajan") totalJajan += Number(t.jumlah || 0);
    }

    return {
      count: trx.length,
      totalTopup,
      totalJajan,
    };
  }, [trx]);

  const exportExcel = () => {
    const rows = trx.map((t) => ({
      tanggal: new Date(t.created_at).toLocaleString("id-ID"),
      id_santri: t.kode_santri,
      nama_santri: santriMap[t.kode_santri] || "-",
      jenis: t.jenis,
      nominal: Number(t.jumlah || 0),
      saldo_setelah: Number(t.saldo_setelah || 0),
      keterangan: t.keterangan || "",
      dibuat_oleh: t.created_by || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `laporan_transaksi_${fromDate}_sd_${toDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();

    const title = "Laporan Transaksi Jajan Santri";
    doc.setFontSize(14);
    doc.text(title, 14, 14);
    doc.setFontSize(10);
    doc.text(`Periode: ${fromDate} s/d ${toDate}`, 14, 20);
    if (kodeSantriFilter) {
      doc.text(
        `Santri: ${kodeSantriFilter} - ${santriMap[kodeSantriFilter] || "-"}`,
        14,
        25
      );
    }

    autoTable(doc, {
      startY: kodeSantriFilter ? 30 : 26,
      head: [
        [
          "Tanggal",
          "ID Santri",
          "Nama",
          "Jenis",
          "Nominal",
          "Saldo Setelah",
          "Keterangan",
          "Oleh",
        ],
      ],
      body: trx.map((t) => [
        new Date(t.created_at).toLocaleString("id-ID"),
        t.kode_santri,
        santriMap[t.kode_santri] || "-",
        t.jenis,
        `Rp ${Number(t.jumlah || 0).toLocaleString("id-ID")}`,
        `Rp ${Number(t.saldo_setelah || 0).toLocaleString("id-ID")}`,
        t.keterangan || "-",
        t.created_by || "-",
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [4, 120, 87] },
    });

    doc.save(`laporan_transaksi_${fromDate}_sd_${toDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-white font-bold text-2xl">Laporan Transaksi</h1>
            <p className="text-emerald-100 text-sm">
              Filter tanggal, santri, export PDF/Excel
            </p>
          </div>
          <button
            onClick={() => router.push("/pengurus")}
            className="bg-white text-emerald-700 px-4 py-2 rounded-xl font-semibold"
          >
            ← Dashboard
          </button>
        </div>

        {/* filter */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <div className="text-sm font-semibold text-emerald-700 mb-1">
                Dari
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div>
              <div className="text-sm font-semibold text-emerald-700 mb-1">
                Sampai
              </div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full border rounded-xl p-3"
              />
            </div>

            <div className="relative">
              <div className="text-sm font-semibold text-emerald-700 mb-1">
                Santri (Opsional)
              </div>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSuggest(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                placeholder="Ketik nama/ID santri..."
                className="w-full border rounded-xl p-3"
              />

              {showSuggest && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-[92px] bg-white border rounded-xl shadow-lg overflow-hidden z-20">
                  {suggestions.map((s) => (
                    <button
                      key={s.kode_id}
                      type="button"
                      onMouseDown={() => {
                        setKodeSantriFilter(s.kode_id);
                        setSearch(`${s.nama} (${s.kode_id})`);
                        setShowSuggest(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50"
                    >
                      <div className="font-semibold text-gray-800">{s.nama}</div>
                      <div className="text-xs text-gray-500">{s.kode_id}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={loadTransaksi}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-semibold"
            >
              Tampilkan
            </button>

            <button
              onClick={() => {
                setKodeSantriFilter("");
                setSearch("");
              }}
              className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl"
            >
              Reset Santri
            </button>

            <button
              onClick={() => window.print()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
            >
              Print
            </button>

            <button
              onClick={exportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl"
            >
              Export Excel
            </button>

            <button
              onClick={exportPDF}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl"
            >
              Export PDF
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-700">
            <b>Total transaksi:</b> {summary.count} &nbsp;|&nbsp;
            <b>Total topup:</b> Rp{" "}
            {summary.totalTopup.toLocaleString("id-ID")} &nbsp;|&nbsp;
            <b>Total jajan:</b> Rp{" "}
            {summary.totalJajan.toLocaleString("id-ID")}
            {loading ? " (memuat...)" : ""}
          </div>
        </div>

        {/* table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="p-3 text-left">Tanggal</th>
                  <th className="p-3 text-left">Santri</th>
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
                    <td className="p-3">
                      {new Date(t.created_at).toLocaleString("id-ID")}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold">
                        {santriMap[t.kode_santri] || "-"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t.kode_santri}
                      </div>
                    </td>
                    <td className="p-3">
                      {t.jenis === "topup" ? "Top Up" : "Jajan"}
                    </td>
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
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                      Tidak ada transaksi pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-center text-emerald-100 text-xs mt-10">
          © 2026 Pondok Pesantren Al-Hasan
        </p>
      </div>
    </div>
  );
}