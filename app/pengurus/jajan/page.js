"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function JajanPage() {
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

  const handleJajan = async () => {
    if (!selectedSantri) {
      alert("Pilih santri dulu!");
      return;
    }

    const jumlah = parseInt(nominal);

    if (!jumlah || jumlah <= 0) {
      alert("Masukkan nominal yang benar");
      return;
    }

    if (jumlah > selectedSantri.saldo) {
      alert("Saldo tidak mencukupi!");
      return;
    }

    const saldoBaru = selectedSantri.saldo - jumlah;

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
        jenis: "jajan",
        jumlah: jumlah,
        saldo_setelah: saldoBaru,
      },
    ]);

    alert("Transaksi jajan berhasil ✅");

    setNominal("");
    fetchSantri();
    setSelectedSantri(null);
  };

  return (
    <div className="min-h-screen p-10 bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Transaksi Jajan
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

        <input
          type="number"
          placeholder="Nominal jajan"
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          className="w-full border p-3 rounded mb-4"
        />

        <button
          onClick={handleJajan}
          className="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700"
        >
          Potong Saldo
        </button>
      </div>
    </div>
  );
}