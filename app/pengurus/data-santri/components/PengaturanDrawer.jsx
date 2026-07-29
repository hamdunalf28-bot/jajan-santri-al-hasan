"use client";

import { useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function PengaturanDrawer({
  open,
  onClose,

  dataSantri,
  selected,

  onReload,
  onBulkDelete,

  nextIdOverride,
  setNextIdOverride,
}) {
  const fileRef = useRef(null);

  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastInfo, setLastInfo] = useState("");

  const selectedRows = useMemo(() => {
    if (!selected?.length) return [];
    const set = new Set(selected);
    return (dataSantri || []).filter((s) => set.has(s.kode_id));
  }, [dataSantri, selected]);

  const exportExcel = (rows, filename) => {
    const exportRows = rows.map((s) => ({
      id_santri: s.kode_id,
      nama_santri: s.nama,
      kelas: s.kelas,
      kamar: s.kamar,
      id_wali: s.wali_kode,
      saldo: s.saldo,
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, filename);
  };

  const exportPDF = (rows, filename) => {
    const doc = new jsPDF();
    doc.text("Data Santri", 14, 14);

    autoTable(doc, {
      startY: 20,
      head: [["ID", "Nama", "Kelas", "Kamar", "Saldo"]],
      body: rows.map((s) => [
        s.kode_id,
        s.nama,
        s.kelas || "",
        s.kamar || "",
        `Rp ${Number(s.saldo || 0).toLocaleString("id-ID")}`,
      ]),
    });

    doc.save(filename);
  };

  // Normalisasi key Excel: lower + hapus spasi
  const normalizeRow = (row) => {
    const out = {};
    Object.keys(row || {}).forEach((k) => {
      const clean = String(k).toLowerCase().replace(/\s/g, "");
      out[clean] = row[k];
    });
    return out;
  };

  const pickSantriName = (r) =>
    r.nama || r.namasantri || r.nama_santri || r.santri || r.siswa || "";

  const pickWaliName = (r) =>
    r.wali ||
    r.namawali ||
    r.nama_wali ||
    r.orangtua ||
    r.ayah ||
    r.ibu ||
    "";

  const pickKelas = (r) => r.kelas || r.rombel || "";
  const pickKamar = (r) => r.kamar || r.asrama || r.room || "";

  // Import: baca semua sheet + fleksibel kolom + anti duplikat
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setProgress(0);
    setLastInfo("");

    try {
      // 1) baca excel semua sheet
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);

      let rows = [];
      wb.SheetNames.forEach((sheetName) => {
        const sheet = wb.Sheets[sheetName];
        const sheetRows = XLSX.utils.sheet_to_json(sheet);
        rows = rows.concat(sheetRows);
      });

      if (rows.length === 0) {
        alert("Excel kosong / tidak ada data.");
        return;
      }

      // 2) ambil last ID dari DB sekali saja
      const { data: lastData, error: lastErr } = await supabase
        .from("santri")
        .select("kode_id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (lastErr) throw lastErr;

      let lastNumber = 0;
      if (lastData?.length) {
        lastNumber = parseInt(String(lastData[0].kode_id).split("-")[1] || "0", 10);
      }

      // 3) tentukan nomor awal (pakai override kalau lebih besar)
      let current = Math.max(lastNumber + 1, Number(nextIdOverride || 1));

      // 4) siapkan anti duplikat (nama+kelas)
      const existingKey = new Set(
        (dataSantri || []).map((s) => `${String(s.nama).toLowerCase()}-${String(s.kelas || "")}`)
      );
      const fileKey = new Set();

      const userBatch = [];
      const santriBatch = [];

      let inserted = 0;
      let skipped = 0;

      for (let i = 0; i < rows.length; i++) {
        const nr = normalizeRow(rows[i]);

        const nSantri = String(pickSantriName(nr) || "").trim();
        const nWali = String(pickWaliName(nr) || "").trim();
        const kls = String(pickKelas(nr) || "").trim();
        const kmr = String(pickKamar(nr) || "").trim();

        if (!nSantri) {
          skipped++;
          continue;
        }

        const key = `${nSantri.toLowerCase()}-${kls}`;
        if (existingKey.has(key) || fileKey.has(key)) {
          skipped++;
          continue;
        }
        fileKey.add(key);

        const formatted = String(current).padStart(4, "0");
        const kodeSantri = `S-${formatted}`;
        const kodeWali = `W-${formatted}`;
        current++;

        userBatch.push({
          kode_id: kodeWali,
          nama: nWali || "Wali Santri",
          password: "123456",
          role: "wali",
        });

        santriBatch.push({
          kode_id: kodeSantri,
          nama: nSantri,
          kelas: kls,
          kamar: kmr,
          wali_kode: kodeWali,
          saldo: 0,
        });

        inserted++;
        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      // 5) insert batch per chunk (biar aman)
      const chunk = async (arr, size, fn) => {
        for (let i = 0; i < arr.length; i += size) {
          const part = arr.slice(i, i + size);
          await fn(part);
        }
      };

      await chunk(userBatch, 200, async (part) => {
        const { error } = await supabase.from("users").insert(part);
        if (error) throw error;
      });

      await chunk(santriBatch, 200, async (part) => {
        const { error } = await supabase.from("santri").insert(part);
        if (error) throw error;
      });

      // 6) update override ID berikutnya
      setNextIdOverride(String(current));

      setLastInfo(`Import selesai. Masuk: ${inserted}, Skip(duplikat/kosong): ${skipped}`);
      alert("Import selesai ✅");

      // kosongkan file supaya tidak bisa import ulang tanpa pilih file lagi
      if (fileRef.current) fileRef.current.value = "";

      await onReload?.();
    } catch (err) {
      console.error(err);
      alert("Import gagal: " + (err?.message || "unknown error"));
    } finally {
      setImporting(false);
      setProgress(0);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-emerald-700">⚙ Pengaturan Data Santri</h2>
          <button
            onClick={onClose}
            className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg"
          >
            Tutup
          </button>
        </div>

        {/* Import */}
        <div className="border rounded-xl p-4 mb-4">
          <div className="font-semibold text-gray-800 mb-2">📥 Import Excel</div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            onChange={handleImport}
            disabled={importing}
            className="w-full border rounded-lg p-2"
          />
          {importing && (
            <div className="mt-3">
              <div className="text-sm text-gray-600 mb-1">Importing... {progress}%</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-emerald-600 h-3 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {lastInfo && <div className="text-xs text-gray-600 mt-2">{lastInfo}</div>}
          <div className="text-xs text-gray-500 mt-2">
            Catatan: sistem membaca <b>semua sheet</b>, nama kolom boleh berbeda (nama/nama_santri/siswa, wali/orangtua, dll).
          </div>
        </div>

        {/* Export */}
        <div className="border rounded-xl p-4 mb-4">
          <div className="font-semibold text-gray-800 mb-3">📤 Export</div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => exportExcel(dataSantri || [], "data_santri.xlsx")}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              Excel (Semua)
            </button>

            <button
              onClick={() => exportExcel(selectedRows, "data_santri_terpilih.xlsx")}
              disabled={selectedRows.length === 0}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm"
            >
              Excel (Terpilih)
            </button>

            <button
              onClick={() => exportPDF(dataSantri || [], "data_santri.pdf")}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
            >
              PDF (Semua)
            </button>

            <button
              onClick={() => exportPDF(selectedRows, "data_santri_terpilih.pdf")}
              disabled={selectedRows.length === 0}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg text-sm"
            >
              PDF (Terpilih)
            </button>
          </div>
        </div>

        {/* ID Override */}
        <div className="border rounded-xl p-4 mb-4">
          <div className="font-semibold text-gray-800 mb-2">🔢 Nomor ID Berikutnya</div>
          <div className="text-xs text-gray-500 mb-2">
            Ini untuk “reset/atur nomor ID” tanpa menghapus data lama. Contoh isi: <b>1</b> atau <b>25</b> (nanti jadi S-0025).
          </div>

          <input
            value={nextIdOverride}
            onChange={(e) => setNextIdOverride(e.target.value)}
            placeholder="contoh: 1"
            className="w-full border rounded-lg p-2"
          />

          <div className="text-xs text-gray-600 mt-2">
            Saat Anda klik “Tambah Santri” → Generate ID akan memakai angka ini bila lebih besar dari ID terakhir.
          </div>
        </div>

        {/* Bulk Delete */}
        <div className="border rounded-xl p-4">
          <div className="font-semibold text-gray-800 mb-2">🗑 Hapus Data Terpilih</div>
          <div className="text-sm text-gray-700 mb-3">
            Dipilih: <b>{selected?.length || 0}</b> santri
          </div>

          <button
            onClick={onBulkDelete}
            disabled={!selected || selected.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg"
          >
            Hapus Terpilih
          </button>

          <div className="text-xs text-gray-500 mt-2">
            Centang santri di tabel, lalu hapus dari sini.
          </div>
        </div>
      </div>
    </div>
  );
}