"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LaporanPage() {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [transaksi, setTransaksi] = useState([]);

  useEffect(() => {
    fetchSantri();
  }, []);

  const fetchSantri = async () => {
    const { data } = await supabase.from("santri").select("*");
    setSantriList(data || []);
  };

  const fetchTransaksi = async (kodeSantri) => {
    const { data } = await supabase
      .from("transaksi")
      .select("*")
      .eq("kode_santri", kodeSantri)
      .order("created_at", { ascending: false });

    setTransaksi(data || []);
  };

  return (
    <div className="min-h-screen p-10 bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Laporan Transaksi
        </h1>

        <select
          onChange={(e) => {
            const santri = santriList.find(
              (s) => s.kode_id === e.target.value
            );
            setSelectedSantri(santri);
            fetchTransaksi(e.target.value);
          }}
          className="w-full border p-3 rounded mb-6"
        >
          <option value="">Pilih Santri</option>
          {santriList.map((s) => (
            <option key={s.kode_id} value={s.kode_id}>
              {s.nama} ({s.kode_id})
            </option>
          ))}
        </select>

        {selectedSantri && (
          <div className="mb-4">
            <p>
              <b>Nama:</b> {selectedSantri.nama}
            </p>
            <p>
              <b>Saldo Saat Ini:</b> Rp {selectedSantri.saldo}
            </p>
          </div>
        )}

        {transaksi.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-300">
              <thead>
                <tr className="bg-green-200">
                  <th className="border p-2">Tanggal</th>
                  <th className="border p-2">Jenis</th>
                  <th className="border p-2">Nominal</th>
                  <th className="border p-2">Saldo Setelah</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map((t) => (
                  <tr key={t.id}>
                    <td className="border p-2">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="border p-2">
                      {t.jenis === "topup" ? "Top Up" : "Jajan"}
                    </td>
                    <td className="border p-2">
                      Rp {t.jumlah}
                    </td>
                    <td className="border p-2">
                      Rp {t.saldo_setelah}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button
              onClick={() => window.print()}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded"
            >
              Print
            </button>
          </div>
        )}
      </div>
    </div>
  );
}