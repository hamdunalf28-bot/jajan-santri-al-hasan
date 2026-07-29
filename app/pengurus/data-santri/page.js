"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Toolbar from "./components/Toolbar";
import FormSantri from "./components/FormSantri";
import TabelSantri from "./components/TabelSantri";
import PengaturanDrawer from "./components/PengaturanDrawer";

export default function DataSantriPage() {
  const router = useRouter();

  const [showForm, setShowForm] = useState(false);
  const [showPengaturan, setShowPengaturan] = useState(false);

  const [dataSantri, setDataSantri] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState("");

  // nomor id berikutnya (override)
  const [nextIdOverride, setNextIdOverride] = useState("1");

  // form
  const [editMode, setEditMode] = useState(false);
  const [oldKodeSantri, setOldKodeSantri] = useState("");
  const [oldKodeWali, setOldKodeWali] = useState("");

  const [kodeSantri, setKodeSantri] = useState("");
  const [kodeWali, setKodeWali] = useState("");
  const [namaSantri, setNamaSantri] = useState("");
  const [namaWali, setNamaWali] = useState("");
  const [kelas, setKelas] = useState("");
  const [kamar, setKamar] = useState("");

  // search + autocomplete
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  // ✅ SORTING
  // opsi: nama_asc, saldo_asc, saldo_desc
  const [sortMode, setSortMode] = useState("nama_asc");

  useEffect(() => {
    // ambil override dari localStorage (biar tidak hilang)
    const saved = localStorage.getItem("next_id_override");
    if (saved) setNextIdOverride(saved);
    loadSantri();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem("next_id_override", String(nextIdOverride || "1"));
  }, [nextIdOverride]);

  const clearForm = () => {
    setOldKodeSantri("");
    setOldKodeWali("");
    setKodeSantri("");
    setKodeWali("");
    setNamaSantri("");
    setNamaWali("");
    setKelas("");
    setKamar("");
  };

  const setKodeSantriDanWali = (value) => {
    setKodeSantri(value);
    if (value?.startsWith("S-")) setKodeWali(value.replace("S-", "W-"));
  };

  const loadSantri = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("santri")
      .select("*")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      console.error(error);
      alert("Gagal mengambil data santri: " + error.message);
      return;
    }

    setDataSantri(data || []);
    setLastSync(new Date().toLocaleString("id-ID"));
  };

  // ===== SEARCH FILTER =====
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dataSantri;
    return dataSantri.filter((s) => {
      const nama = (s.nama || "").toLowerCase();
      const id = (s.kode_id || "").toLowerCase();
      return nama.includes(q) || id.includes(q);
    });
  }, [dataSantri, search]);

  // ===== SORTING =====
  const filteredSortedForTable = useMemo(() => {
    const arr = [...filtered];

    if (sortMode === "nama_asc") {
      arr.sort((a, b) =>
        String(a.nama || "").localeCompare(String(b.nama || ""), "id", {
          sensitivity: "base",
        })
      );
      return arr;
    }

    if (sortMode === "saldo_asc") {
      arr.sort((a, b) => {
        const sa = Number(a.saldo || 0);
        const sb = Number(b.saldo || 0);
        if (sa !== sb) return sa - sb;
        return String(a.nama || "").localeCompare(String(b.nama || ""), "id", {
          sensitivity: "base",
        });
      });
      return arr;
    }

    if (sortMode === "saldo_desc") {
      arr.sort((a, b) => {
        const sa = Number(a.saldo || 0);
        const sb = Number(b.saldo || 0);
        if (sa !== sb) return sb - sa;
        return String(a.nama || "").localeCompare(String(b.nama || ""), "id", {
          sensitivity: "base",
        });
      });
      return arr;
    }

    return arr;
  }, [filtered, sortMode]);

  // suggestions (autocomplete)
  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return dataSantri
      .filter(
        (s) =>
          (s.nama || "").toLowerCase().includes(q) ||
          (s.kode_id || "").toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [dataSantri, search]);

  const generateNextId = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("kode_id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      alert("Gagal generate ID: " + error.message);
      return;
    }

    let next = 1;
    if (data?.length) {
      const lastKode = data[0].kode_id;
      const lastNum = parseInt(String(lastKode).split("-")[1] || "0", 10);
      next = lastNum + 1;
    }

    // pakai override jika lebih besar
    const overrideNum = Number(nextIdOverride || 1);
    if (overrideNum > next) next = overrideNum;

    const formatted = String(next).padStart(4, "0");
    setKodeSantri(`S-${formatted}`);
    setKodeWali(`W-${formatted}`);

    // naikkan override biar tidak sama jika klik generate lagi
    setNextIdOverride(String(next + 1));
  };

  // ====== toolbar ======
  const handleTambah = async () => {
    setEditMode(false);
    clearForm();
    setShowForm(true);
    await generateNextId();
  };

  const handleRefresh = async () => {
    await loadSantri();
    alert("Data di-refresh ✅");
  };

  // ====== edit/hapus ======
  const handleEdit = (santri) => {
    setEditMode(true);
    setShowForm(true);

    setOldKodeSantri(santri.kode_id);
    setOldKodeWali(santri.wali_kode);

    setKodeSantri(santri.kode_id);
    setKodeWali(santri.wali_kode);

    setNamaSantri(santri.nama || "");
    setNamaWali("");
    setKelas(santri.kelas || "");
    setKamar(santri.kamar || "");
  };

  const handleDelete = async (kodeSantriHapus) => {
    if (!confirm(`Yakin ingin menghapus ${kodeSantriHapus}?`)) return;

    const s = dataSantri.find((x) => x.kode_id === kodeSantriHapus);
    const waliKode = s?.wali_kode;

    await supabase.from("transaksi").delete().eq("kode_santri", kodeSantriHapus);

    const { error: errS } = await supabase
      .from("santri")
      .delete()
      .eq("kode_id", kodeSantriHapus);

    if (errS) {
      console.error(errS);
      alert("Gagal menghapus santri: " + errS.message);
      return;
    }

    if (waliKode) {
      const { error: errU } = await supabase
        .from("users")
        .delete()
        .eq("kode_id", waliKode);
      if (errU) console.error(errU);
    }

    alert("Berhasil dihapus ✅");
    setSelected((prev) => prev.filter((x) => x !== kodeSantriHapus));
    await loadSantri();
  };

  const handleBulkDelete = async () => {
    if (selected.length === 0) {
      alert("Belum ada santri yang dipilih.");
      return;
    }
    if (!confirm(`Yakin hapus ${selected.length} santri terpilih?`)) return;

    const waliCodes = dataSantri
      .filter((s) => selected.includes(s.kode_id))
      .map((s) => s.wali_kode)
      .filter(Boolean);

    await supabase.from("transaksi").delete().in("kode_santri", selected);

    const { error: errS } = await supabase
      .from("santri")
      .delete()
      .in("kode_id", selected);

    if (errS) {
      console.error(errS);
      alert("Gagal bulk delete santri: " + errS.message);
      return;
    }

    if (waliCodes.length > 0) {
      const { error: errU } = await supabase
        .from("users")
        .delete()
        .in("kode_id", waliCodes);
      if (errU) console.error(errU);
    }

    alert("Hapus terpilih berhasil ✅");
    setSelected([]);
    await loadSantri();
  };

  // ====== form ======
  const handleBatal = () => {
    setShowForm(false);
    setEditMode(false);
    clearForm();
  };

  const handleSimpan = async () => {
    if (!kodeSantri || !namaSantri) {
      alert("ID Santri dan Nama Santri wajib diisi.");
      return;
    }
    if (!kodeWali) {
      alert("ID Wali kosong. Pastikan ID santri format S-xxxx.");
      return;
    }

    if (!editMode) {
      if (!namaWali) {
        alert("Nama Wali wajib diisi saat tambah santri.");
        return;
      }

      const { error: errU } = await supabase.from("users").insert([
        { kode_id: kodeWali, nama: namaWali, password: "123456", role: "wali" },
      ]);
      if (errU) {
        console.error(errU);
        alert("Gagal menambah wali: " + errU.message);
        return;
      }

      const { error: errS } = await supabase.from("santri").insert([
        {
          kode_id: kodeSantri,
          nama: namaSantri,
          kelas,
          kamar,
          wali_kode: kodeWali,
          saldo: 0,
        },
      ]);

      if (errS) {
        console.error(errS);
        alert("Gagal menambah santri: " + errS.message);
        await supabase.from("users").delete().eq("kode_id", kodeWali);
        return;
      }

      alert("Santri berhasil ditambahkan ✅");
      setShowForm(false);
      clearForm();
      await loadSantri();
      return;
    }

    const newKodeSantri = kodeSantri;
    const newKodeWali = kodeWali;

    const santriKodeBerubah = oldKodeSantri && oldKodeSantri !== newKodeSantri;
    const waliKodeBerubah = oldKodeWali && oldKodeWali !== newKodeWali;

    const { error: errUpdateSantri } = await supabase
      .from("santri")
      .update({
        kode_id: newKodeSantri,
        nama: namaSantri,
        kelas,
        kamar,
        wali_kode: newKodeWali,
      })
      .eq("kode_id", oldKodeSantri || newKodeSantri);

    if (errUpdateSantri) {
      console.error(errUpdateSantri);
      alert("Gagal update santri: " + errUpdateSantri.message);
      return;
    }

    if (oldKodeWali) {
      const payload = {};
      if (namaWali) payload.nama = namaWali;
      if (waliKodeBerubah) payload.kode_id = newKodeWali;

      if (Object.keys(payload).length > 0) {
        const { error: errUpdateUser } = await supabase
          .from("users")
          .update(payload)
          .eq("kode_id", oldKodeWali);
        if (errUpdateUser) console.error(errUpdateUser);
      }
    }

    if (santriKodeBerubah) {
      await supabase
        .from("transaksi")
        .update({ kode_santri: newKodeSantri })
        .eq("kode_santri", oldKodeSantri);
    }
    if (waliKodeBerubah) {
      await supabase
        .from("transaksi")
        .update({ kode_wali: newKodeWali })
        .eq("kode_wali", oldKodeWali);
    }

    alert("Data berhasil diupdate ✅");
    setEditMode(false);
    setShowForm(false);
    clearForm();
    await loadSantri();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Santri</h1>
            <p className="text-emerald-100 text-sm">
              Terakhir sync: {lastSync || "-"} {loading ? "(memuat...)" : ""}
            </p>
          </div>

          <button
            onClick={() => router.push("/pengurus")}
            className="bg-white text-emerald-700 px-5 py-3 rounded-xl font-semibold"
          >
            ← Dashboard
          </button>
        </div>

        <Toolbar
          onTambah={handleTambah}
          onPengaturan={() => setShowPengaturan(true)}
          onRefresh={handleRefresh}
        />

        {/* SEARCH + SORT */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-5 relative">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
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
                <div className="absolute left-4 right-4 top-[110px] bg-white border rounded-xl shadow-lg overflow-hidden z-20">
                  {suggestions.map((s) => (
                    <button
                      key={s.kode_id}
                      type="button"
                      onMouseDown={() => {
                        setSearch(s.nama);
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

            <div>
              <div className="font-semibold text-emerald-700 mb-2">Urutkan</div>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value)}
                className="w-full border rounded-xl p-3 bg-white"
              >
                <option value="nama_asc">Abjad A-Z</option>
                <option value="saldo_asc">Saldo Terkecil</option>
                <option value="saldo_desc">Saldo Terbesar</option>
              </select>
            </div>
          </div>
        </div>

        {/* FORM */}
        {showForm && (
          <FormSantri
            editMode={editMode}
            kodeSantri={kodeSantri}
            kodeWali={kodeWali}
            namaSantri={namaSantri}
            namaWali={namaWali}
            kelas={kelas}
            kamar={kamar}
            setKodeSantri={setKodeSantriDanWali}
            setNamaSantri={setNamaSantri}
            setNamaWali={setNamaWali}
            setKelas={setKelas}
            setKamar={setKamar}
            onGenerateID={generateNextId}
            onSimpan={handleSimpan}
            onBatal={handleBatal}
          />
        )}

        {/* TABLE */}
        <TabelSantri
          data={filteredSortedForTable}
          selected={selected}
          setSelected={setSelected}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onBulkDelete={handleBulkDelete}
        />
      </div>

      {/* DRAWER PENGATURAN */}
      <PengaturanDrawer
        open={showPengaturan}
        onClose={() => setShowPengaturan(false)}
        dataSantri={dataSantri}
        selected={selected}
        onReload={loadSantri}
        onBulkDelete={handleBulkDelete}
        nextIdOverride={nextIdOverride}
        setNextIdOverride={setNextIdOverride}
      />
    </div>
  );
}