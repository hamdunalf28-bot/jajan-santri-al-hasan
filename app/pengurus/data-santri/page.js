"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DataSantriPage() {
  const [kodeSantri, setKodeSantri] = useState("");
  const [kodeWali, setKodeWali] = useState("");
  const [namaSantri, setNamaSantri] = useState("");
  const [namaWali, setNamaWali] = useState("");
  const [kelas, setKelas] = useState("");
  const [kamar, setKamar] = useState("");

  useEffect(() => {
    generateId();
  }, []);

  const generateId = async () => {
    const { data } = await supabase
      .from("santri")
      .select("kode_id")
      .order("created_at", { ascending: false })
      .limit(1);

    let nextNumber = 1;

    if (data && data.length > 0) {
      const lastKode = data[0].kode_id; // S-0001
      const number = parseInt(lastKode.split("-")[1]);
      nextNumber = number + 1;
    }

    const formatted = String(nextNumber).padStart(4, "0");

    setKodeSantri(`S-${formatted}`);
    setKodeWali(`W-${formatted}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // insert wali ke tabel users
    await supabase.from("users").insert([
      {
        kode_id: kodeWali,
        nama: namaWali,
        password: "123456",
        role: "wali",
      },
    ]);

    // insert santri
    await supabase.from("santri").insert([
      {
        kode_id: kodeSantri,
        nama: namaSantri,
        kelas,
        kamar,
        wali_kode: kodeWali,
        saldo: 0,
      },
    ]);

    alert("Santri berhasil ditambahkan ✅");

    setNamaSantri("");
    setNamaWali("");
    setKelas("");
    setKamar("");

    generateId();
  };

  return (
    <div className="min-h-screen p-10 bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-green-700 mb-6">
          Data Santri
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={kodeSantri}
            readOnly
            className="w-full border p-3 rounded bg-gray-100"
          />

          <input
            type="text"
            value={kodeWali}
            readOnly
            className="w-full border p-3 rounded bg-gray-100"
          />

          <input
            type="text"
            placeholder="Nama Santri"
            value={namaSantri}
            onChange={(e) => setNamaSantri(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <input
            type="text"
            placeholder="Nama Wali"
            value={namaWali}
            onChange={(e) => setNamaWali(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <input
            type="text"
            placeholder="Kelas"
            value={kelas}
            onChange={(e) => setKelas(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <input
            type="text"
            placeholder="Kamar"
            value={kamar}
            onChange={(e) => setKamar(e.target.value)}
            className="w-full border p-3 rounded"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700"
          >
            Simpan
          </button>
        </form>
      </div>
    </div>
  );
}