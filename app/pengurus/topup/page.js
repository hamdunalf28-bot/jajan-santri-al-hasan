"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function TopupPage() {
  const [santriList, setSantriList] = useState([]);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [nominal, setNominal] = useState("");

  useEffect(() => {
    fetchSantri();
  }, []);

  const fetchSantri = async () => {
    const { data } = await supabase.from("santri").select("*");
    setSantriList(data || []);
  };

  const handleTopup = async (amount) => {
    if (!selectedSantri) {
      alert("Pilih santri dulu!");
      return;
    }

    const topupAmount = amount || parseInt(nominal);

    if (!topupAmount || topupAmount <= 0) {
      alert("Masukkan nominal yang benar");
      return;
    }

    const saldoBaru =
      parseInt(selectedSantri.saldo) + parseInt(topupAmount);

    // Update saldo
    await supabase
      .from("santri")
      .update({ saldo: saldoBaru })
      .eq("kode_id", selectedSantri.kode_id);

    // Simpan transaksi
    await supabase.from("transaksi").insert([
      {
        kode_santri: selectedSantri.kode_id,
        kode_wali: selectedSantri.wali_kode,
        jenis: "topup",
        jumlah: topupAmount,
        saldo_setelah: saldoBaru,
      },
    ]);

    alert("Top Up berhasil ✅");

    setNominal("");
    fetchSantri();
    setSelectedSantri(null);
  };

  return (
    <div className="min-h-screen p-10 bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Top Up Saldo
        </h1>

        <select
          onChange={(e) =>
            setSelectedSantri(
              santriList.find((s) => s.kode_id === e.target.value)
            )
          }
          className="w-full border p-3 rounded mb-4"
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
              Saldo Saat Ini: <b>Rp {selectedSantri.saldo}</b>
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[100000, 200000, 300000, 400000, 500000].map((amount) => (
            <button
              key={amount}
              onClick={() => handleTopup(amount)}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              {amount / 1000}K
            </button>
          ))}
        </div>

        <input
          type="number"
          placeholder="Nominal lain"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        <button
          onClick={() => handleTopup()}
          className="w-full bg-green-700 text-white p-3 rounded hover:bg-green-800"
        >
          Top Up
        </button>
      </div>
    </div>
  );
}