"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

import Toolbar from "./components/Toolbar";
import FormSantri from "./components/FormSantri";
import TabelSantri from "./components/TabelSantri";

export default function DataSantriPage() {
  const router = useRouter();

  // =========================
  // STATE UI
  // =========================
  const [showForm, setShowForm] = useState(false);

  // (nanti dipakai untuk drawer pengaturan)
  const [showPengaturan, setShowPengaturan] = useState(false);

  // =========================
  // STATE DATA
  // =========================
  const [dataSantri, setDataSantri] = useState([]);
  const [selected, setSelected] = useState([]);

  // =========================
  // STATE FORM
  // =========================
  const [editMode, setEditMode] = useState(false);

  const [oldKodeSantri, setOldKodeSantri] = useState("");
  const [oldKodeWali, setOldKodeWali] = useState("");

  const [kodeSantri, setKodeSantri] = useState("");
  const [kodeWali, setKodeWali] = useState("");

  const [namaSantri, setNamaSantri] = useState("");
  const [namaWali, setNamaWali] = useState("");

  const [kelas, setKelas] = useState("");
  const [kamar, setKamar] = useState("");

  // =========================
  // SEARCH + AUTOCOMPLETE
  // =========================
  const [search, setSearch] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  const filteredForTable = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dataSantri;
    return dataSantri.filter((s) => {
      const nama = (s.nama || "").toLowerCase();
      const id = (s.kode_id || "").toLowerCase();
      return nama.includes(q) || id.includes(q);
    });
  }, [dataSantri, search]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    // batasi 8 saran biar ringan
    return dataSantri
      .filter((s) => (s.nama || "").toLowerCase().includes(q))
      .slice(0, 8);
  }, [dataSantri, search]);

  // =========================
  // LOAD DATA
  // =========================
  const loadSantri = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Gagal mengambil data santri");
      return;
    }

    setDataSantri(data || []);
  };

  useEffect(() => {
    loadSantri();
  }, []);

  // =========================
  // HELPERS
  // =========================
  const clearForm = () => {
    setKodeSantri("");
    setKodeWali("");
    setNamaSantri("");
    setNamaWali("");
    setKelas("");
    setKamar("");
    setOldKodeSantri("");
    setOldKodeWali("");
  };

  const setKodeSantriDanWali = (value) => {
    setKodeSantri(value);
    // otomatis sinkron W-xxxx jika format S-xxxx
    if (value && value.startsWith("S-")) {
      setKodeWali(value.replace("S-", "W-"));
    }
  };

  const generateNextId = async () => {
    const { data, error } = await supabase
      .from("santri")
      .select("kode_id")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error(error);
      alert("Gagal generate ID");
      return;
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastKode = data[0].kode_id; // S-0001
      const lastNumber = parseInt(String(lastKode).split("-")[1] || "0", 10);
      nextNumber = lastNumber + 1;
    }

    const formatted = String(nextNumber).padStart(4, "0");
    setKodeSantri(`S-${formatted}`);
    setKodeWali(`W-${formatted}`);
  };

  // =========================
  // EVENTS: TOOLBAR
  // =========================
  const handleTambah = async () => {
    setEditMode(false);
    clearForm();
    setShowForm(true);
    await generateNextId();
  };

  const handleRefresh = async () => {
    await loadSantri();
  };

  const handlePengaturan = () => {
    setShowPengaturan(true);
  };

  // =========================
  // EVENTS: EDIT / DELETE
  // =========================
  const handleEdit = (santri) => {
    setEditMode(true);
    setShowForm(true);

    setOldKodeSantri(santri.kode_id);
    setOldKodeWali(santri.wali_kode);

    setKodeSantri(santri.kode_id);
    setKodeWali(santri.wali_kode);

    setNamaSantri(santri.nama || "");
    setKelas(santri.kelas || "");
    setKamar(santri.kamar || "");

    // nama wali diambil dari users (opsional); biar sederhana: isi dari tabel users saat dibutuhkan
    // untuk saat ini: kita biarkan user isi manual saat edit kalau perlu
    setNamaWali("");
  };

  const handleDelete = async (kode) => {
    if (!confirm(`Yakin ingin menghapus santri ${kode}?`)) return;

    // cari wali_kode dari data yang sudah ada
    const s = dataSantri.find((x) => x.kode_id === kode);
    const waliKode = s?.wali_kode;

    // hapus santri
    const { error: err1 } = await supabase.from("santri").delete().eq("kode_id", kode);
    if (err1) {
      console.error(err1);
      alert("Gagal menghapus santri");
      return;
    }

    // hapus user wali (kalau ada)
    if (waliKode) {
      const { error: err2 } = await supabase.from("users").delete().eq("kode_id", waliKode);
      if (err2) console.error(err2);
    }

    // (opsional) transaksi dibiarkan sebagai histori; kalau mau ikut dihapus nanti bisa dibuat opsi
    alert("Berhasil dihapus ✅");
    await loadSantri();
  };

  // =========================
  // EVENTS: FORM BUTTONS
  // =========================
  const handleBatal = () => {
    setShowForm(false);
    setEditMode(false);
    clearForm();
  };

  const handleSimpan = async () => {
    if (!kodeSantri || !namaSantri) {
      alert("ID Santri dan Nama Santri wajib diisi");
      return;
    }
    if (!kodeWali) {
      alert("ID Wali kosong. Pastikan ID santri format S-xxxx agar otomatis W-xxxx.");
      return;
    }

    if (!editMode) {
      // =========================
      // INSERT (TAMBAH)
      // =========================
      if (!namaWali) {
        alert("Nama Wali wajib diisi saat tambah santri");
        return;
      }

      // insert wali (users)
      const { error: errU } = await supabase.from("users").insert([
        {
          kode_id: kodeWali,
          nama: namaWali,
          password: "123456",
          role: "wali",
        },
      ]);

      if (errU) {
        console.error(errU);
        alert("Gagal menambah wali (mungkin ID wali sudah ada)");
        return;
      }

      // insert santri
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
        alert("Gagal menambah santri (mungkin ID santri sudah ada)");
        // rollback user wali jika santri gagal (opsional)
        await supabase.from("users").delete().eq("kode_id", kodeWali);
        return;
      }

      alert("Santri berhasil ditambahkan ✅");
      clearForm();
      setShowForm(false);
      await loadSantri();
      return;
    }

    // =========================
    // UPDATE (EDIT)
    // =========================
    // jika user mengubah kode santri, kita ikut ubah wali_kode + users + transaksi
    const newKodeSantri = kodeSantri;
    const newKodeWali = kodeWali;

    const santriKodeBerubah = oldKodeSantri && oldKodeSantri !== newKodeSantri;
    const waliKodeBerubah = oldKodeWali && oldKodeWali !== newKodeWali;

    // update tabel santri
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
      alert("Gagal update santri");
      return;
    }

    // update user wali (nama + (opsional) kode_id)
    // jika namaWali kosong, kita tidak ubah nama wali
    if (oldKodeWali) {
      const updateUserPayload = {};
      if (namaWali) updateUserPayload.nama = namaWali;
      if (waliKodeBerubah) updateUserPayload.kode_id = newKodeWali;

      if (Object.keys(updateUserPayload).length > 0) {
        const { error: errUpdateUser } = await supabase
          .from("users")
          .update(updateUserPayload)
          .eq("kode_id", oldKodeWali);

        if (errUpdateUser) {
          console.error(errUpdateUser);
          // tidak kita hentikan, tapi beri info
          alert("Santri terupdate, tapi update data wali gagal. Cek tabel users.");
        }
      }
    }

    // jika kode berubah, update transaksi supaya laporan tetap nyambung
    if (santriKodeBerubah) {
      await supabase.from("transaksi").update({ kode_santri: newKodeSantri }).eq("kode_santri", oldKodeSantri);
    }
    if (waliKodeBerubah) {
      await supabase.from("transaksi").update({ kode_wali: newKodeWali }).eq("kode_wali", oldKodeWali);
    }

    alert("Data berhasil diupdate ✅");
    setEditMode(false);
    clearForm();
    setShowForm(false);
    await loadSantri();
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-green-800">
      <div className="max-w-7xl mx-auto p-6">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Data Santri</h1>
            <p className="text-emerald-100">Kelola data santri dan wali santri</p>
          </div>

          <button
            onClick={() => router.push("/pengurus")}
            className="bg-white text-emerald-700 px-5 py-3 rounded-xl font-semibold"
          >
            ← Dashboard
          </button>
        </div>

        {/* TOOLBAR */}
        <Toolbar onTambah={handleTambah} onPengaturan={handlePengaturan} onRefresh={handleRefresh} />

        {/* SEARCH + AUTOCOMPLETE */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-5 relative">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowSuggest(true);
            }}
            onBlur={() => {
              // delay supaya klik suggestion kebaca
              setTimeout(() => setShowSuggest(false), 150);
            }}
            placeholder="Cari santri (nama atau ID)..."
            className="w-full border rounded-xl p-3"
          />

          {showSuggest && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 top-[72px] bg-white border rounded-xl shadow-lg overflow-hidden z-20">
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
          data={filteredForTable}
          selected={selected}
          setSelected={setSelected}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* PENGATURAN (sementara placeholder, supaya tidak bingung) */}
      {showPengaturan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h2 className="text-xl font-bold text-emerald-700 mb-2">⚙ Pengaturan</h2>
            <p className="text-sm text-gray-600 mb-4">
              Pengaturan (Import/Export/Bulk Delete) akan kita pindahkan ke komponen{" "}
              <b>PengaturanDrawer.jsx</b> pada langkah berikutnya.
            </p>

            <div className="text-sm text-gray-700 mb-4">
              <div>
                <b>Santri terpilih:</b> {selected.length}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPengaturan(false)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}