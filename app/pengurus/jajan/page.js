"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function JajanPage() {
  const router = useRouter();

  const [santriList, setSantriList] = useState([]);
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);

  const [nominal, setNominal] = useState("");
  const [keterangan, setKeterangan] = useState("");

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user"));
    if (!u || u.role !== "pengurus") router.push("/");
  }, [router]);

  const loadSantri = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("*")
      .order("nama", { ascending: true });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data santri: " + error.message);
      return;
    }

    setSantriList(data || []);
  };

  useEffect(() => {
    loadSantri();
  }, []);

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

  const pickSantri = (s) => {
    setSelectedSantri(s);
    setSearch(`${s.nama} (${s.kode_id})`);
    setShowSuggest(false);
  };

  const preset = [5000, 10000, 15000, 20000, 25000];
  const fillNominal = (value) => setNominal(String(value));

  const prosesJajan = async () => {
    const user = JSON.parse(localStorage.getItem("user"));

    if (!user || user.role !== "pengurus") {
      alert("Session pengurus tidak ditemukan. Silakan login ulang.");
      router.push("/");
      return;
    }

    if (!selectedSantri) {
      alert("Pilih santri dulu.");
      return;
    }

    const n = Number(nominal);
    if (!n || n <= 0) {
      alert("Nominal tidak valid.");
      return;
    }

    const saldoLama = Number(selectedSantri.saldo || 0);
    if (n > saldoLama) {
      alert("Saldo tidak cukup.");
      return;
    }

    const saldoBaru = saldoLama - n;

    // 1) Update saldo dulu
    const { error: errUpdate } = await supabase
      .from("santri")
      .update({ saldo: saldoBaru })
      .eq("kode_id", selectedSantri.kode_id);

    if (errUpdate) {
      console.error(errUpdate);
      alert("Gagal update saldo: " + errUpdate.message);
      return;
    }

    // 2) Insert transaksi (pakai select() agar jelas benar-benar masuk)
    const ket = (keterangan || "").trim() || "Transaksi jajan";

    const { data: trxData, error: errTrx } = await supabase
      .from("transaksi")
      .insert([
        {
          kode_santri: selectedSantri.kode_id,
          kode_wali: selectedSantri.wali_kode,
          jenis: "jajan",
          jumlah: n,
          saldo_setelah: saldoBaru,
          keterangan: ket,
          created_by: user.kode_id,
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (errTrx) {
      console.error(errTrx);

      // ROLLBACK saldo kalau transaksi gagal
      await supabase
        .from("santri")
        .update({ saldo: saldoLama })
        .eq("kode_id", selectedSantri.kode_id);

      alert(
        "Gagal menyimpan transaksi jajan (saldo dikembalikan).\n\nError: " +
          errTrx.message
      );
      return;
    }

    // pastikan benar-benar ada row yang masuk
    if (!trxData || trxData.length === 0) {
      // rollback juga
      await supabase
        .from("santri")
        .update({ saldo: saldoLama })
        .eq("kode_id", selectedSantri.kode_id);

      alert("Transaksi tidak tercatat (saldo dikembalikan).");
      return;
    }

    alert(
      `Transaksi jajan berhasil ✅\nSantri: ${selectedSantri.nama}\nNominal: Rp ${n.toLocaleString(
        "id-ID"
      )}\nSaldo: Rp ${saldoLama.toLocaleString("id-ID")} → Rp ${saldoBaru.toLocaleString(
        "id-ID"
      )}`
    );

    // reset
    setNominal("");
    setKeterangan("");
    setSelectedSantri(null);
    setSearch("");

    await loadSantri();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white font-bold text-2xl">Transaksi Jajan</h1>
          <button
            onClick={() => router.push("/pengurus")}
            className="bg-white text-emerald-700 px-4 py-2 rounded-xl font-semibold"
          >
            ← Dashboard
          </button>
        </div>

        {/* Cari santri */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-5 relative">
          <div className="font-semibold text-emerald-700 mb-2">Cari Santri</div>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggest(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
            placeholder="Ketik nama atau ID santri..."
            className="w-full border rounded-xl p-3"
          />

          {showSuggest && suggestions.length > 0 && (
            <div className="absolute left-5 right-5 top-[108px] bg-white border rounded-xl shadow-lg overflow-hidden z-20">
              {suggestions.map((s) => (
                <button
                  key={s.kode_id}
                  type="button"
                  onMouseDown={() => pickSantri(s)}
                  className="w-full text-left px-4 py-3 hover:bg-emerald-50"
                >
                  <div className="font-semibold text-gray-800">{s.nama}</div>
                  <div className="text-xs text-gray-500">
                    {s.kode_id} • Saldo: Rp{" "}
                    {Number(s.saldo || 0).toLocaleString("id-ID")}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedSantri && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border">
              <div className="font-semibold text-gray-800">
                {selectedSantri.nama} ({selectedSantri.kode_id})
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Saldo saat ini:{" "}
                <b>
                  Rp {Number(selectedSantri.saldo || 0).toLocaleString("id-ID")}
                </b>
              </div>
            </div>
          )}
        </div>

        {/* Nominal */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="font-semibold text-emerald-700 mb-3">
            Pilih Nominal (klik untuk mengisi kolom)
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            {preset.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => fillNominal(p)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-semibold transition"
              >
                Rp {p.toLocaleString("id-ID")}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <input
              type="number"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="Nominal jajan (contoh 12000)"
              className="border rounded-xl p-3 w-full"
            />

            <input
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Keterangan (opsional), contoh: jajan kantin"
              className="border rounded-xl p-3 w-full"
            />
          </div>

          <button
            type="button"
            onClick={prosesJajan}
            className="mt-4 w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl font-semibold"
          >
            Proses Potong Saldo
          </button>
        </div>
      </div>
    </div>
  );
}